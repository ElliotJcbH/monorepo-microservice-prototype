import { DatabaseService } from '@app/common/providers/database/database.service';
import { status } from '@grpc/grpc-js';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import {
    CreateUserRequest,
    CreateUserResponse,
    GetUserByIdRequest,
    GetUserByIdResponse,
    User,
} from 'proto-gen/user/v1/user_pb';

@Injectable()
export class UserService {
    constructor(private readonly db: DatabaseService) {}

    async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
        const { email, username, password } = request;

        let res: {
            user_id: string;
            email: string;
            username: string;
            role: string;
            is_verified: boolean;
            created_at: Date;
        };

        // HAVE TO GET HASHED PASSWORD
        try {
            const query = `
                INSERT INTO auth.users(email, password, username)
                VALUES($1, $2, $3)
                RETURNING user_id, email, username, role, is_verified, created_at
            `;

            res = await this.db.queryOne<typeof res>(query, [
                email,
                password,
                username,
            ]);

            if (!res || !res.user_id) throw new Error("Failed to create user: no row returned");
        } catch (e) {
            console.error(`Error [INTERNAL] Failed to create user`, e);
            throw new RpcException({
                code: status.INTERNAL,
                message: e instanceof Error ? e.message : String(e),
            });
        }

        return {
            user: {
                userId: res.user_id,
                username: res.username,
                email: res.email,
                role: res.role,
                isVerifed: res.is_verified,
                createdAt: res.created_at,
            },
        };
    }

    async getUserById(
        request: GetUserByIdRequest,
    ): Promise<GetUserByIdResponse> {
        const { userId } = request;

        let res: {
            user_id: string;
            email: string;
            username: string;
            role: string;
            is_verified: boolean;
            created_at: Date;
        };

        try {
            const query = `
                SELECT user_id, email, username, role, is_verified, created_at
                FROM auth.users
                WHERE user_id = $1
            `;

            res = await this.db.queryOne<typeof res>(query, [userId]);

            if (!res || !res.user_id) {
                console.error(`Error [NOT FOUND] User does not exist`);
                throw new RpcException({
                    code: status.NOT_FOUND,
                    message: 'User does not exist',
                });
            }
        } catch (e) {
            if (e instanceof RpcException) throw e;
            console.error(`Error [INTERNAL] Failed to create user`, e);
            throw new RpcException({
                code: status.INTERNAL,
                message: e instanceof Error ? e.message : String(e),
            });
        }

        return {
            user: {
                userId: res.user_id,
                username: res.username,
                email: res.email,
                role: res.role,
                isVerifed: res.is_verified,
                createdAt: res.created_at,
            },
        };
    }

    async getUserByEmail() {}

    async updateUserData() {}

    async deleteUser() {}
}
