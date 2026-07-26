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
    SessionUserInfo,
    VerifySessionRequest,
    VerifySessionResponse,
} from 'proto-gen/auth/v1/session_pb';
import { TokenService } from '../common/providers/token/token.service';
import { DatabaseService } from '../../../../libs/common/src/providers/database/database.service';
import { PasswordService } from '../password/password.service';
import type { ClientGrpc } from '@nestjs/microservices';
import {
    GetUserByEmailResponse,
    UserServiceClient,
} from 'proto-gen/user/v1/user_pb';
import { ProtoServices } from '@app/common/types/protoservice.types';
import { catchError, firstValueFrom, Observable, take, throwError } from 'rxjs';
import { logGrpcException } from '@app/common/utils/exception-logger';
import { ServiceError, status } from '@grpc/grpc-js';
import { GrpcException } from '@app/common/classes/exceptions/grpc.exception';

@Injectable()
export class SessionService implements OnModuleInit {
    private extUserService!: UserServiceClient;

    constructor(
        private tokenService: TokenService,
        private passwordService: PasswordService,
        private db: DatabaseService,
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
        const res: Observable<GetUserByEmailResponse> = this.extUserService
            .getUserByEmail({ email: request.email })
            .pipe(
                take(1),
                catchError((err: ServiceError) => {
                    logGrpcException(err);
                    return throwError(
                        () => new GrpcException(err.code, err.details),
                    );
                }),
            );

        const user = (await firstValueFrom(res)).user;

        if (!user) {
            console.error(
                'Error [Not Found Exception] User with that email does not exist',
            );
            throw new NotFoundException('User with that email does not exist'); // reminder: only throw grpc exceptions in pipes
        }

        const userData: SessionUserInfo = {
            userId: user.userId,
            username: user.username,
            email: user.email,
            role: user.role,
            isVerifed: user.isVerifed,
            createdAt: user.createdAt,
        };

        return {
            session: await this.tokenService.createTokens(userData),
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
            console.error(`Error [Bad Request Exception] Invalid access token`);
            throw new BadRequestException('Invalid access token');
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
            console.error(
                `Error [Internal Server Error] Failed to delete refresh token`,
            );
            throw new InternalServerErrorException(
                'Failed to delete refresh token',
            );
        }

        return {
            revoked: true,
        };
    }

    renewSession(request: RenewSessionRequest): Promise<RenewSessionResponse> {
        throw new Error('Method not implemented.');
    }
}
