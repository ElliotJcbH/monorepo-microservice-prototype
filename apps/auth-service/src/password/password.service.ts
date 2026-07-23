import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
    StorePasswordRequest,
    StorePasswordResponse,
    VerifyPasswordRequest,
    VerifyPasswordResponse,
} from 'proto-gen/auth/v1/password_pb';
import { DatabaseService } from '../common/providers/database/database.service';
import { RpcException } from '@nestjs/microservices';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
    constructor(private db: DatabaseService) {}

    async storePassword(
        request: StorePasswordRequest,
    ): Promise<StorePasswordResponse> {
        const { userId, password } = request;

        const hashedPassword = argon2.hash(password);

        try {
            const query = `
                INSERT INTO auth.users(password)
                VALUES ($1)
                WHERE user_id = $2
                RETURNING user_id
            `;

            const res = await this.db.queryOne<{ user_id: string }>(query, [hashedPassword, userId]);

            if(!res || !res.user_id) throw new Error();
        } catch (e) {
            console.error('Error [Database Error] Failed to store password', e);
            throw new InternalServerErrorException('Failed to store password');
        }

        return {
           isStored: true,
        };
    }

    async verifyPassword(
        request: VerifyPasswordRequest,
    ): Promise<VerifyPasswordResponse> {
        const { email, password } = request;

        let hashedPassword: string;

        try {
            const query = `
                SELECT password FROM auth.users
                WHERE email = $1;
            `;

            const res = await this.db.queryOne<{ password: string }>(query, [
                email,
            ]);
            hashedPassword = res.password;
            if (!hashedPassword) {
                console.error(
                    'Error [Bad Request Exception] User does not exist',
                );
                throw new RpcException('User does not exist');
            }
        } catch (e) {
            console.error(`Error [Database Error] Failed to get password`);
            throw new RpcException('Failed to get user');
        }

        const isValid = await argon2.verify(hashedPassword, password);

        if (!isValid) {
            console.error(
                'Error [Bad Request Exception] Incorrect credentials',
            );
            throw new RpcException('Incorrect credentials');
        }

        return {
            isValid,
        };
    }
}
