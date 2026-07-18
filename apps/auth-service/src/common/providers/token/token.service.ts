import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import IAccessTokenPayload from '../../interfaces/access-token-payload.interface';
import { SessionInfo, SessionUserInfo } from 'proto-gen/auth/v1/session';
import * as argon2 from 'argon2';
import crypto from 'node:crypto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class TokenService {
    constructor(private readonly jwtService: JwtService) {}

    async createTokens(
        userId: string,
        email: string,
        password: string,
    ): Promise<SessionInfo> {
        const accessToken = this.createAccessToken(userId, email, password);
        const payload: IAccessTokenPayload =
            this.jwtService.decode(accessToken);

        const refreshToken = await this.createRefreshToken(payload.jti || '');

        const user: SessionUserInfo = {
            userId: '',
            username: '',
            email: '',
            role: '',
            isVerifed: false,
            createdAt: undefined,
        };

        return {
            accessToken,
            refreshToken,
            user,
            iat: payload.iat || 0, // iat, exp will never be 0
            exp: payload.exp || 0,
        };
    }

    createAccessToken(userId: string, email: string, password: string): string {
        const payload = {
            userId,
        };

        const extraOptions: JwtSignOptions = {
            subject: userId,
        };

        const accessToken = this.jwtService.sign(payload, extraOptions);
        return accessToken;
    }

    async createRefreshToken(jwtId: string): Promise<string> {
        if (!jwtId) {
            console.log('Error [Server Error] Failed to create token'); // TODO: Fix this bullshit
            throw new RpcException('Failed to create token');
        }

        const key = crypto.randomBytes(32).toString('hex');
        const hash = await argon2.hash(key, {});

        // 1. Upload to db: hash, jwtid
        // 2. return key

        return '';
    }

    async renewAccessToken(accessToken: string, refreshToken: string) {
        const payload: IAccessTokenPayload =
            this.jwtService.decode(accessToken);

        const jwtId = payload.jti;

        // 1. get refresh_token with jwtId -> refresh_token
        // 2. refresh_token -> verify with argon2.verify() -> valid
        // 3. valid? -> create accessToken -> accessToken
        // 4. accessToken -> payload.jwtId -> update db with with new jwtId, refresh_token is unchanged
        // 5. return accessToken
    }

    async deleteRefreshToken(refreshToken: string) {
        // 1. get refresh_token with jwtId -> refresh_token
        // 2. refresh_token -> verify with argon2.verify() -> valid
        // 3. if valid, delete refresh token
        // 4. return true
    }

    verifyAccessToken(accessToken: string) {
        const payload: IAccessTokenPayload =
            this.jwtService.verify(accessToken);

        if (payload) return payload;

        return null;
    }
}
