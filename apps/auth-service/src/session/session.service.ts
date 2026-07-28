import {
    Inject,
    Injectable,
    OnModuleInit,
} from '@nestjs/common';
import {
    SessionInfo,
    SessionUserInfo,
} from 'proto-gen/auth/v1/session_pb';
import { TokenService } from '../common/providers/token/token.service';
import { PasswordService } from '../password/password.service';
import { RpcException, type ClientGrpc } from '@nestjs/microservices';
import {
    GetUserByEmailResponse,
    UserServiceClient,
} from 'proto-gen/user/v1/user_pb';
import { ProtoServices } from '@app/common/types/protoservice.types';
import { catchError, firstValueFrom, Observable, take } from 'rxjs';
import { ServiceError, status } from '@grpc/grpc-js';
import IAccessTokenPayload from '../common/interfaces/access-token-payload.interface';

@Injectable()
export class SessionService implements OnModuleInit {
    private extUserService!: UserServiceClient;

    constructor(
        private tokenService: TokenService,
        private passwordService: PasswordService,
        @Inject('USER_PACKAGE') private userClient: ClientGrpc,
    ) {}

    onModuleInit() {
        this.extUserService = this.userClient.getService<UserServiceClient>(
            ProtoServices.UserService,
        );
    }

    /**
     * @throws {RpcException} Bubbles up from getUserData when something goes wrong with the call to externalUserService.getUserByEmail
     * @throws {RpcException} Bubbled up from getUserData when the user does not exist
     */
    async grantSession(email: string, password: string): Promise<SessionInfo> {
        await this.passwordService.verifyPassword(email, password);
        const userData = await this.getUserData(email);

        const tokens = await this.tokenService.createTokens(userData);
        const session = this.sessionBuilder(
            tokens.accessToken,
            tokens.refreshToken,
            tokens.payload,
        );

        return session;
    }

    /**
     * @throws {RpcException} when the payload returned from tokenService.verifyAccessToken is falsy
     */
    verifySession(accessToken: string): IAccessTokenPayload {
        const payload = this.tokenService.verifyAccessToken(accessToken, {});

        return payload;
    }

    /**
     * @throws {RpcException} when the value returned by tokenService.deleteRefreshToken is falsy
     */
    async revokeSession(
        accessToken: string,
        refreshToken: string
    ): Promise<boolean> {
        const isDeleted = await this.tokenService.deleteRefreshToken(
            accessToken,
            refreshToken,
        );

        return isDeleted;
    }

    /**
     * @throws {RpcException} when any props from tokenService.createTokens result is falsy
     */
    async renewSession(
        accessToken: string,
        refreshToken: string
    ): Promise<SessionInfo> {
        const payload: IAccessTokenPayload =
            this.tokenService.decodeAccessToken(accessToken);

        const userData = await this.getUserData(payload.user.email);

        const tokens = await this.tokenService.renewAccessToken(
            accessToken,
            refreshToken,
        );

        if (!tokens.accessToken || !tokens.refreshToken || !tokens.payload) {
            throw new RpcException({
                code: status.UNKNOWN,
                message: 'Requested new access token is falsy',
            });
        }

        const session = this.sessionBuilder(
            tokens.accessToken,
            tokens.refreshToken,
            {
                ...tokens.payload,
                user: userData,
            },
        );

        return session;
    }

    private sessionBuilder(
        accessToken: string,
        refreshToken: string,
        payload: IAccessTokenPayload,
    ): SessionInfo {
        const user: SessionUserInfo = {
            userId: payload.user.userId,
            username: payload.user.username,
            email: payload.user.email,
            role: payload.user.role,
            isVerifed: payload.user.isVerifed,
            createdAt: payload.user.createdAt,
        };

        return {
            accessToken,
            refreshToken,
            user,
            iat: payload.iat || 0, // iat, exp will never be 0
            exp: payload.exp || 0,
        };
    }

    /**
     * @throws {RpcException} when something goes wrong with the call to externalUserService.getUserByEmail
     * @throws {RpcException} when the user does not exist
     */
    private async getUserData(email: string): Promise<SessionUserInfo> {
        const res: Observable<GetUserByEmailResponse> = this.extUserService
            .getUserByEmail({ email })
            .pipe(
                take(1),
                catchError((err: ServiceError) => {
                    throw new RpcException(err);
                }),
            );

        const user = (await firstValueFrom(res))?.user || undefined;

        if (!user || !user.userId) {
            throw new RpcException({
                code: status.NOT_FOUND,
                message: 'User with that email does not exist',
            });
        }

        const userData: SessionUserInfo = {
            userId: user.userId,
            username: user.username,
            email: user.email,
            role: user.role,
            isVerifed: user.isVerifed,
            createdAt: user.createdAt,
        };

        return userData;
    }
}
