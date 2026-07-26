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
                    console.error(
                        `Error [${status[err.code]}] ${err.message}`,
                    );
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
                message: 'User with that email does not exist'
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

        const session = await this.tokenService.createTokens(userData);

        if(!session) {
            console.error(
                'Error [UNKNOWN] Requested session is undefined'
            );
            throw new RpcException({
                code: status.UNKNOWN,
                message: 'Requested session is undefined'
            })
        }

        return {
            session
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
                message: 'Payload is not parseable'
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
