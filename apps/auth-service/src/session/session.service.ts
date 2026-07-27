import {
    BadRequestException,
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    OnModuleInit,
} from '@nestjs/common';
import {
    GrantSessionRequest,
    GrantSessionResponse,
    RenewSessionRequest,
    RenewSessionResponse,
    RevokeSessionRequest,
    RevokeSessionResponse,
    SessionInfo,
    SessionUserInfo,
    VerifySessionRequest,
    VerifySessionResponse,
} from 'proto-gen/auth/v1/session_pb';
import { TokenService } from '../common/providers/token/token.service';
import { DatabaseService } from '../../../../libs/common/src/providers/database/database.service';
import { PasswordService } from '../password/password.service';
import { RpcException, type ClientGrpc } from '@nestjs/microservices';
import {
    GetUserByEmailResponse,
    UserServiceClient,
} from 'proto-gen/user/v1/user_pb';
import { ProtoServices } from '@app/common/types/protoservice.types';
import { catchError, firstValueFrom, Observable, take, throwError } from 'rxjs';
import { logGrpcException } from '@app/common/utils/exception-logger';
import { ServiceError, status } from '@grpc/grpc-js';
import { GrpcException } from '@app/common/classes/exceptions/grpc.exception';
import IAccessTokenPayload from '../common/interfaces/access-token-payload.interface';
import e from 'express';

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

    async grantSession(
        request: GrantSessionRequest,
    ): Promise<GrantSessionResponse> {
        await this.passwordService.verifyPassword(request);
        const userData = await this.getUserData(request.email);

        const tokens = await this.tokenService.createTokens(userData);

        if (!tokens.accessToken || !tokens.refreshToken || !tokens.payload) {
            console.error('Error [UNKNOWN] Tokens were not properly created');
            throw new RpcException({
                code: status.UNKNOWN,
                message: 'Tokens were not properly created',
            });
        }

        const session = this.sessionBuilder(
            tokens.accessToken,
            tokens.refreshToken,
            tokens.payload,
        );

        return {
            session,
        };

        // return from(
        //     this.tokenService.createTokens('', request.email, request.password),
        // ).pipe(map((session) => ({ session })));
    }

    verifySession(request: VerifySessionRequest): VerifySessionResponse {
        const payload = this.tokenService.verifyAccessToken(
            request.accessToken,
        );

        if (!payload) {
            console.error(`Error [UNKNOWN] Payload is not parseable`);
            throw new RpcException({
                code: status.UNKNOWN,
                message: 'Payload is not parseable',
            });
        }

        return {
            valid: true,
        };
    }

    async revokeSession(
        request: RevokeSessionRequest,
    ): Promise<RevokeSessionResponse> {
        const { accessToken, refreshToken } = request;

        const isDeleted = await this.tokenService.deleteRefreshToken(
            accessToken,
            refreshToken,
        );

        if (!isDeleted) {
            console.error(`Error [UNKOWN] Refresh token was not deleted`);
            throw new RpcException({
                code: status.UNKNOWN,
                message: 'Refresh token was not deleted',
            });
        }

        return {
            revoked: true,
        };
    }

    async renewSession(
        request: RenewSessionRequest,
    ): Promise<RenewSessionResponse> {
        const { accessToken, refreshToken } = request;
        const payload: IAccessTokenPayload =
            this.tokenService.decodeAccessToken(accessToken); // dont need to check because we have a guard

        const userData = await this.getUserData(payload.user.email);

        const tokens = await this.tokenService.renewAccessToken(
            accessToken,
            refreshToken,
        );

        if (!tokens.accessToken || !tokens.refreshToken || !tokens.payload) {
            console.error(`Error [UNKOWN] Requested new access token is falsy`);
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

        return {
            session,
        };
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

    private async getUserData(email: string): Promise<SessionUserInfo> {
        const res: Observable<GetUserByEmailResponse> = this.extUserService
            .getUserByEmail({ email })
            .pipe(
                take(1),
                catchError((err: ServiceError) => {
                    console.error(`Error [${status[err.code]}] ${err.message}`);
                    throw new RpcException(err);
                    // logGrpcException(err);
                    // return throwError(
                    //     () => new GrpcException(err.code, err.details),
                    // );
                    // TODO: I dont think i should be using this in grpc service
                }),
            );

        const user = (await firstValueFrom(res))?.user || undefined;

        if (!user) {
            console.error(
                'Error [NOT FOUND] User with that email does not exist',
            );
            throw new RpcException({
                code: status.NOT_FOUND,
                message: 'User with that email does not exist',
            }); // reminder: only throw grpc exceptions in pipes
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
