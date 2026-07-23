import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import IAccessTokenPayload from '../../interfaces/access-token-payload.interface';
import { SessionInfo, SessionUserInfo } from 'proto-gen/auth/v1/session_pb';
import * as argon2 from 'argon2';
import crypto from 'node:crypto';
import { RpcException } from '@nestjs/microservices';
import { DatabaseService } from '../database/database.service';
import KEY_CONFIG from '../../configs/keys.config';

@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly db: DatabaseService,
    ) {}

    async createTokens(data: SessionUserInfo): Promise<SessionInfo> {
        const accessToken = this.createAccessToken(data);
        const payload: IAccessTokenPayload =
            this.jwtService.decode(accessToken);

        const refreshToken = await this.createRefreshToken(
            payload.sub || '',
            payload.jti || '',
        );

        const user: SessionUserInfo = {
            userId: data.userId,
            username: data.username,
            email: data.email,
            role: data.role,
            isVerifed: data.isVerifed,
            createdAt: data.createdAt,
        };

        return {
            accessToken,
            refreshToken,
            user,
            iat: payload.iat || 0, // iat, exp will never be 0
            exp: payload.exp || 0,
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

    async createRefreshToken(userId: string, jwtId: string): Promise<string> {
        // 1. Upload to db: hash, jwtid
        // 2. return key
        if (!jwtId) {
            console.log('Error [Server Error] Failed to create token'); // TODO: Fix this bullshit
            throw new RpcException('Failed to create token');
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

            if (res.refresh_token) throw new Error();
        } catch (e) {
            console.error(
                'Error [Database Error] Failed upload refresh token',
                e,
            );
            throw new RpcException('Failed to upload refresh token');
        }

        return key;
    }

    async renewAccessToken(
        accessToken: string,
        refreshToken: string,
    ): Promise<string> {
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

        return newAccessToken;
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

    verifyAccessToken(accessToken: string) {
        const payload: IAccessTokenPayload =
            this.jwtService.verify(accessToken);

        if (payload) return payload;

        return null;
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
