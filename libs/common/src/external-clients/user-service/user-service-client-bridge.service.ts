import { ServiceResponseUnexpectedException } from '@app/common/classes/errors/external-errors/service-response-unexpected.exception';
import { IUserRecord } from '@app/common/interfaces/user-record.interface';
import { ProtoServices } from '@app/common/types/protoservice.types';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import {
    GetUserByEmailResponse,
    UserServiceClient,
} from 'proto-gen/user/v1/user_pb';
import { firstValueFrom, map, Observable, take } from 'rxjs';

@Injectable()
export class UserServiceClientBridge implements OnModuleInit {
    private extUserService!: UserServiceClient;

    constructor(@Inject('USER_PACKAGE') private userClient: ClientGrpc) {}

    onModuleInit() {
        this.extUserService = this.userClient.getService<UserServiceClient>(
            ProtoServices.UserService,
        );
    }

    async getUserWithEmail(email: string): Promise<IUserRecord> {
        const res: Observable<GetUserByEmailResponse> = this.extUserService
            .getUserByEmail({ email })
            .pipe(
                take(1),
                map((response) => {
                    if (response?.user == null) {
                        throw new ServiceResponseUnexpectedException(
                            '{ user: { ...(shape of User from user_pb.proto) } }',
                            JSON.stringify(response),
                        );
                    }
                    return response;
                }),
            );

        const user = (await firstValueFrom(res)).user!;

        return {
            userId: user.userId,
            username: user.username,
            email: user.email,
            role: user.role,
            isVerified: user.isVerifed,
            createdAt: user.createdAt || new Date(), // FUUUUUUUUUUUUCK
        };
    }
}
