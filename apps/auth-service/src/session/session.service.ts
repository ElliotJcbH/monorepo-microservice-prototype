import { Injectable } from '@nestjs/common';
import { SessionInfo, SessionUserInfo } from 'proto-gen/auth/v1/session_pb';
import { TokenService } from '../common/providers/token/token.service';
import { PasswordService } from '../password/password.service';
import {
    User,
} from 'proto-gen/user/v1/user_pb';
import IAccessTokenPayload from '../common/interfaces/access-token-payload.interface';
import { UserServiceClientBridge } from '@app/common/external-clients/user-service/user-service-client-bridge.service';

@Injectable()
export class SessionService {
    constructor(
        private tokenService: TokenService,
        private passwordService: PasswordService,
        private userServiceClientBridge: UserServiceClientBridge,
    ) {}

    async grantSession(email: string, password: string): Promise<SessionInfo> {
        await this.passwordService.verifyPassword(email, password);
        const user = await this.userServiceClientBridge.getUserWithEmail(email);
        const userInfo = this.userInfoBuilder(user);

        const tokens = await this.tokenService.createTokens(userInfo);
        const session = this.sessionBuilder(
            tokens.accessToken,
            tokens.refreshToken,
            user,
            tokens.payload,
        );

        return session;
    }

    verifySession(accessToken: string): IAccessTokenPayload {
        const payload = this.tokenService.verifyAccessToken(accessToken, {});
        return payload;
    }

    async revokeSession(
        accessToken: string,
        refreshToken: string,
    ): Promise<boolean> {
        const isDeleted = await this.tokenService.deleteRefreshToken(
            accessToken,
            refreshToken,
        );

        return isDeleted;
    }

    async renewSession(
        accessToken: string,
        refreshToken: string,
    ): Promise<SessionInfo> {
        const payload: IAccessTokenPayload =
            this.tokenService.decodeAccessToken(accessToken);

        const user = await this.userServiceClientBridge.getUserWithEmail(
            payload.user.email,
        );
        const userInfo = this.userInfoBuilder(user);

        const tokens = await this.tokenService.renewAccessToken(
            accessToken,
            refreshToken,
        );

        const session = this.sessionBuilder(
            tokens.accessToken,
            tokens.refreshToken,
            user,
            {
                ...tokens.payload,
                user: userInfo,
            },
        );

        return session;
    }

    private userInfoBuilder(user: User): SessionUserInfo {
        return {
            userId: user.userId,
            username: user.username,
            email: user.email,
            role: user.role,
            isVerifed: user.isVerifed,
            createdAt: user.createdAt,
        };
    }

    private sessionBuilder(
        accessToken: string,
        refreshToken: string,
        user: User,
        payload: IAccessTokenPayload, // All of the info here is updated
    ): SessionInfo {
        return {
            accessToken,
            refreshToken,
            user,
            iat: payload.iat || 0, // iat, exp will never be 0
            exp: payload.exp || 0,
        };
    }
}
