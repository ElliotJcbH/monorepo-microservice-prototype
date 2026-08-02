import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import IAccessTokenPayload from '../../interfaces/access-token-payload.interface';
import { SessionUserInfo } from 'proto-gen/auth/v1/session_pb';
import * as argon2 from 'argon2';
import crypto, { randomUUID } from 'node:crypto';
import KEY_CONFIG from '../../configs/keys.config';
import { RefreshTokenRepository } from './refresh-token-record.service';
import { RefreshTokenException } from '@app/common/classes/errors/authentication-errors/refresh-token.exception';
import { AcessTokenException } from '@app/common/classes/errors/authentication-errors/access-token.exception';

@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly tokenRecordService: RefreshTokenRepository,
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
            jwtid: randomUUID(),
        };

        const accessToken = this.jwtService.sign(payload, extraOptions);
        return accessToken;
    }

    async createRefreshToken(userId: string, jwtId: string): Promise<string> {
        const key = crypto.randomBytes(32).toString('hex');
        const hash = await argon2.hash(key, {});
        const expiresAt = new Date(
            Date.now() + KEY_CONFIG.refreshTokenExpirationMs,
        );

        await this.tokenRecordService.insert(jwtId, userId, hash, expiresAt);

        return key;
    }

    async renewAccessToken(
        accessToken: string,
        refreshToken: string,
    ): Promise<{
        accessToken: string;
        refreshToken: string;
        payload: IAccessTokenPayload;
    }> {
        const payload: IAccessTokenPayload =
            this.jwtService.decode(accessToken);
        const jwtId = payload.jti;
        await this.verifyRefreshToken(jwtId || '', refreshToken);

        const newAccessToken = this.createAccessToken(payload.user);
        const newPayload: IAccessTokenPayload =
            this.jwtService.decode(newAccessToken);
        const newJwtId = newPayload.jti;

        await this.tokenRecordService.update(jwtId!, newJwtId!);

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
        const payload: IAccessTokenPayload =
            this.jwtService.decode(accessToken);
        const jwtId = payload.jti;
        await this.verifyRefreshToken(jwtId || '', refreshToken);

        const res = await this.tokenRecordService.delete(jwtId!);

        return true;
    }

    verifyAccessToken(
        accessToken: string,
        options?: JwtVerifyOptions,
    ): IAccessTokenPayload {
        try {
            return this.jwtService.verify(accessToken, options || {});
        } catch (e) {
            throw new AcessTokenException(
                options?.subject || '',
                options?.jwtid || '',
                {
                    cause: e,
                },
            );
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
        const { refresh_token: hashedRefreshToken } =
            await this.tokenRecordService.get(jwtId);

        const isValid = await argon2.verify(hashedRefreshToken, refreshToken);

        if (!isValid) {
            throw new RefreshTokenException(jwtId, '');
        }
    }
}
