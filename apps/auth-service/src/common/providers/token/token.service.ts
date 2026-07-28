import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import IAccessTokenPayload from '../../interfaces/access-token-payload.interface';
import { SessionInfo, SessionUserInfo } from 'proto-gen/auth/v1/session_pb';
import * as argon2 from 'argon2';
import crypto from 'node:crypto';
import { RpcException } from '@nestjs/microservices';
import { DatabaseService } from '../../../../../../libs/common/src/providers/database/database.service';
import KEY_CONFIG from '../../configs/keys.config';
import { status } from '@grpc/grpc-js';

@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly db: DatabaseService,
    ) {}

    async createTokens(data: SessionUserInfo): Promise<{
        accessToken: string;
        refreshToken: string;
        payload: IAccessTokenPayload;
    }> {
        const accessToken = this.createAccessToken(data);
        const payload: IAccessTokenPayload =
            this.jwtService.decode(accessToken);

        const refreshToken = await this.createRefreshToken(
            payload.sub || '',
            payload.jti || '',
        );

        return {
            accessToken,
            refreshToken,
            payload,
        };
    }

    createAccessToken(data: SessionUserInfo): string {
        const payload = {
            userId: data.userId,
            username: data.username,
            email: data.email,
            role: data.role,
            isVerifed: data.isVerifed,
            createdAt: data.createdAt,
        };

        const extraOptions: JwtSignOptions = {
            subject: data.userId,
        };

        const accessToken = this.jwtService.sign(payload, extraOptions);
        return accessToken;
    }

    /**
     * @throws {RpcException} if the token is expired or malformed
     * @throws {InternalServerErrorException} if the database query fails
    */
    async createRefreshToken(userId: string, jwtId: string): Promise<string> {
        if (!jwtId) {
            throw new RpcException({
                code: status.INVALID_ARGUMENT,
                message: 'Failed to create token: Missing jwtId'
            });
            throw new TypeError('jwtId must be a valid string');
        }

        const key = crypto.randomBytes(32).toString('hex');
        const hash = await argon2.hash(key, {});
        const expiresAt = Date.now() + KEY_CONFIG.refreshTokenExpirationMs;

        try {
            const query = `
                INSERT INTO auth.refresh_tokens(jwt_id, user_id, refresh_token, expires_at) 
                VALUES ($1, $2, $3, $4)
                RETURNING refresh_token
            `;

            const res = await this.db.queryOne<{ refresh_token: string }>(
                query,
                [jwtId, userId, hash, expiresAt],
            );

            if (!res.refresh_token) throw new Error();
        } catch (e) {
            throw new RpcException({
                code: status.INTERNAL,
                message: `Failed to upload refresh token: ${e}`
            });
        }

        return key;
    }

    /**
     * @throws {} if the update query for jwt_id fails 
    */
    async renewAccessToken(
        accessToken: string,
        refreshToken: string,
    ): Promise<{
        accessToken: string;
        refreshToken: string;
        payload: IAccessTokenPayload;
    }> {
        // 1. get refresh_token with jwtId -> refresh_token
        // 2. refresh_token -> verify with argon2.verify() -> valid
        // 3. valid? -> create accessToken -> accessToken
        // 4. accessToken -> payload.jwtId -> update db with with new jwtId, refresh_token is unchanged
        // 5. return accessToken
        const payload: IAccessTokenPayload =
            this.jwtService.decode(accessToken);
        const jwtId = payload.jti;
        await this.verifyRefreshToken(jwtId || '', refreshToken);

        const newAccessToken = this.createAccessToken(payload.user);
        const newPayload: IAccessTokenPayload =
            this.jwtService.decode(newAccessToken);
        const newJwtId = newPayload.jti;

        try {
            const query = `
                UPDATE auth.refresh_tokens
                SET COLUMN jwt_id = $1
                WHERE jwt_id = $2
                RETURNING jwt_id
            `;
            const res = await this.db.queryOne<{ jwt_id: string }>(query, [
                newJwtId,
                jwtId,
            ]);

            if (!res.jwt_id) throw new Error();
        } catch (e) {
            console.error(
                `Error [Database Error] Failed to update jwt_id of user with id ${newPayload.sub}`,
                e,
            );
            throw new RpcException('Failed to update jwt_id');
        }

        return {
            accessToken: newAccessToken,
            refreshToken,
            payload: newPayload,
        };
    }

    async deleteRefreshToken(
        accessToken: string,
        refreshToken: string,
    ): Promise<boolean> {
        // 1. get refresh_token with jwtId -> refresh_token
        // 2. refresh_token -> verify with argon2.verify() -> valid
        // 3. if valid, delete refresh token
        // 4. return true
        const payload: IAccessTokenPayload =
            this.jwtService.decode(accessToken);
        const jwtId = payload.jti;
        await this.verifyRefreshToken(jwtId || '', refreshToken);

        try {
            const query = `
                DELETE FROM auth.refresh_tokens
                WHERE jwt_id = $1
                RETURNING jwt_id
            `;

            const res = await this.db.queryOne<{ jwt_id: string }>(query, [
                jwtId,
            ]);

            if (!res || !res.jwt_id) throw new Error();
        } catch (e) {
            console.error(
                'Error [Database Error] Failed to delete refresh token',
                e,
            );
            throw new InternalServerErrorException(
                'Failed to delete refresh token',
            );
        }

        return true;
    }

    verifyAccessToken(accessToken: string, options?: JwtVerifyOptions): IAccessTokenPayload { // TODO: maybe dont handle the rpc exception here? Throw a generic error first?
        try {
            return this.jwtService.verify(accessToken, options || {});
        } catch (e) {
            throw new UnauthorizedException('The provided access token is invalid');
        }
    }

    decodeAccessToken(accessToken: string): IAccessTokenPayload {
        const payload: IAccessTokenPayload =
            this.jwtService.decode(accessToken);

        return payload;
    }

    async verifyRefreshToken(
        jwtId: string,
        refreshToken: string,
    ): Promise<void> {
        let hashedRefreshToken: string = '';

        try {
            const query = `
                SELECT refresh_token, expires_at FROM auth.refresh_tokens
                WHERE jwt_id = $1
            `;

            const res = await this.db.queryOne<{
                refresh_token: string;
                expires_at: Date;
            }>(query, [jwtId]);
            hashedRefreshToken = res.refresh_token;

            if (!hashedRefreshToken) throw new Error('Missing refresh token');
        } catch (e) {
            console.error(
                'Error [Database Error] Failed to upload refresh token',
                e,
            );
            throw new InternalServerErrorException(
                'Failed to upload refresh token',
            );
        }

        const isValid = await argon2.verify(hashedRefreshToken, refreshToken);

        if (!isValid) {
            console.error('Error [Unauthorized Error] Invalid refresh token');
            throw new RpcException('Invalid refresh token');
        }
    }
}
