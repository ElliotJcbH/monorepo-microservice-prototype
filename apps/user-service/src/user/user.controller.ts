import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import {
    CreateUserRequest,
    CreateUserResponse,
    DeleteUserRequest,
    DeleteUserResponse,
    GetUserByEmailRequest,
    GetUserByEmailResponse,
    GetUserByIdRequest,
    GetUserByIdResponse,
    UpdateUserDataRequest,
    UpdateUserDataResponse,
    UserServiceController,
    UserServiceControllerMethods,
} from 'proto-gen/user/v1/user_pb';
import { Observable } from 'rxjs';

@Controller()
@UserServiceControllerMethods()
export class UserController implements UserServiceController {
    constructor(private readonly userService: UserService) {}

    createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
        return this.userService.createUser(request);
    }

    getUserById(request: GetUserByIdRequest): Promise<GetUserByIdResponse> {
        throw new Error('Method not implemented.');
    }

    getUserByEmail(
        request: GetUserByEmailRequest,
    ): Promise<GetUserByEmailResponse> {
        throw new Error('Method not implemented.');
    }

    updateUserData(
        request: UpdateUserDataRequest,
    ): Promise<UpdateUserDataResponse> {
        throw new Error('Method not implemented.');
    }

    deleteUser(request: DeleteUserRequest): Promise<DeleteUserResponse> {
        throw new Error('Method not implemented.');
    }
}
