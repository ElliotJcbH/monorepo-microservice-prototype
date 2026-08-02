import { ProtoServices } from '@app/common/types/protoservice.types';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import {
    GetUserByEmailResponse,
    User,
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

    async getUserWithEmail(email: string): Promise<User> {
        const res: Observable<GetUserByEmailResponse> = this.extUserService
            .getUserByEmail({ email })
            .pipe(
                take(1),
                map((response) => {
                    if (response?.user == null) {
                        throw new Error('User not found'); // TODO: Change to something more appropriate
                    }
                    return response;
                }),
            );

        const user = (await firstValueFrom(res)).user;

        return user!;
    }
}
