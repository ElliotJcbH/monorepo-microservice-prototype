import { GrpcException } from '@app/common/classes/errors/grpc.exception';
import { ProtoServices } from '@app/common/types/protoservice.types';
import { logGrpcException } from '@app/common/utils/exception-logger';
import { ServiceError } from '@grpc/grpc-js';
import {
    Inject,
    Injectable,
    InternalServerErrorException,
    OnModuleInit,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import {
    GetUserByEmailResponse,
    User,
    UserServiceClient,
} from 'proto-gen/user/v1/user_pb';
import { catchError, firstValueFrom, Observable, take, throwError } from 'rxjs';
import { validate as uuidValidate } from 'uuid';

@Injectable()
export class UserService implements OnModuleInit {
    private extUserService!: UserServiceClient;

    constructor(@Inject('USER_PACKAGE') private client: ClientGrpc) {}

    onModuleInit() {
        this.extUserService = this.client.getService<UserServiceClient>(
            ProtoServices.UserService,
        );
    }

    async getUser(param: string): Promise<User> {
        // const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        // uuidRegex.test(param)
        if (uuidValidate(param)) {
            return await this.getUserById(param);
        } else {
            return await this.getUserByEmail(param);
        }
    }

    async getUserByEmail(email: string): Promise<User> {
        const res: Observable<GetUserByEmailResponse> = this.extUserService
            .getUserByEmail({
                email,
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

        const user = (await firstValueFrom(res)).user;

        if (!user) {
            console.error('Error [Internal Server Error] User is undefined');
            throw new InternalServerErrorException('Failed to get user');
        }

        return user;
    }

    async getUserById(userId: string): Promise<User> {
        const res: Observable<GetUserByEmailResponse> = this.extUserService
            .getUserById({
                userId,
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

        const user = (await firstValueFrom(res)).user;

        if (!user) {
            console.error('Error [Internal Server Error] User is undefined');
            throw new InternalServerErrorException('Failed to get user');
        }

        return user;
    }
}
