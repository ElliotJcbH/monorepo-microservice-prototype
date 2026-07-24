import {
    Inject,
    Injectable,
    InternalServerErrorException,
    OnModuleInit,
} from '@nestjs/common';
import {
    GrantSessionResponse,
    RenewSessionResponse,
    RevokeSessionResponse,
    SessionInfo,
    SessionServiceClient,
    VerifySessionResponse,
} from 'proto-gen/auth/v1/session_pb';
import type { ClientGrpc, RpcException } from '@nestjs/microservices';
import { ProtoServices } from '@app/common/types/protoservice.types';
import { GrantSessionDto } from '../common/dtos/grant-session.dto';
import { catchError, firstValueFrom, Observable, take, throwError } from 'rxjs';
import { ServiceError } from '@grpc/grpc-js';
import { GrpcException } from '@app/common/classes/exceptions/grpc.exception';
import { logGrpcException } from '@app/common/utils/exception-logger';

@Injectable()
export class SessionService implements OnModuleInit {
    private extSessionService!: SessionServiceClient;

    constructor(@Inject('SESSION_PACKAGE') private authClient: ClientGrpc) {}

    onModuleInit() {
        this.extSessionService =
            this.authClient.getService<SessionServiceClient>(
                ProtoServices.SessionService,
            );
    }

    async grantSession(data: GrantSessionDto): Promise<SessionInfo> {
        const res: Observable<GrantSessionResponse> = this.extSessionService
            .grantSession({
                email: data.email,
                password: data.password,
            })
            .pipe(
                take(1),
                catchError((err: ServiceError) => {
                    logGrpcException(err);
                    return throwError(
                        () => new GrpcException(err.code, err.details),
                    );
                }),
            );

        const session = (await firstValueFrom(res)).session;

        if (!session) {
            console.error('Error [Internal Server Error] Session is undefined');
            throw new InternalServerErrorException('Failed to create session');
        }

        return session;
    }

    async revokeSession(
        accessToken: string,
        refreshToken: string,
    ): Promise<boolean> {
        const res: Observable<RevokeSessionResponse> = this.extSessionService
            .revokeSession({
                accessToken,
                refreshToken,
            })
            .pipe(
                take(1),
                catchError((err: ServiceError) => {
                    logGrpcException(err);
                    return throwError(
                        () => new GrpcException(err.code, err.details),
                    );
                }),
            );

        const isRevoked = (await firstValueFrom(res)).revoked;

        return isRevoked;
    }

    async renewSession(
        accessToken: string,
        refreshToken: string,
    ): Promise<SessionInfo> {
        const res: Observable<RenewSessionResponse> = this.extSessionService
            .renewSession({
                accessToken,
                refreshToken,
            })
            .pipe(
                take(1),
                catchError((err: ServiceError) => {
                    logGrpcException(err);
                    return throwError(
                        () => new GrpcException(err.code, err.details),
                    );
                }),
            );

        const session = (await firstValueFrom(res)).session;

        if (!session) {
            console.error('Error [Internal Server Error] Session is undefined');
            throw new InternalServerErrorException('Failed to create session');
        }

        return session;
    }

    async verifySession(accessToken: string): Promise<boolean> {
        const res: Observable<VerifySessionResponse> = this.extSessionService
            .verifySession({
                accessToken,
            })
            .pipe(
                take(1),
                catchError((err: ServiceError) => {
                    logGrpcException(err);
                    return throwError(
                        () => new GrpcException(err.code, err.details),
                    );
                }),
            );

        const isValid = (await firstValueFrom(res)).valid;

        return isValid;
    }
}
