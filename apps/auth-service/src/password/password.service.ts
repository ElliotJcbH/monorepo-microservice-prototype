import { Injectable } from '@nestjs/common';
import {
    VerifyPasswordRequest,
    VerifyPasswordResponse,
} from 'proto-gen/auth/v1/password_pb';
import { DatabaseService } from '../common/providers/database/database.service';
import { RpcException } from '@nestjs/microservices';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
    constructor(private db: DatabaseService) {}

    async verifyPassword(
        request: VerifyPasswordRequest,): Promise<VerifyPasswordResponse> {
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
                console.log(
                    'Error [Bad Request Exception] User does not exist',
                );
                throw new RpcException('User does not exist');
            }
        } catch (e) {
            console.log(`Error [Database Error] Failed to get password`);
            throw new RpcException('Failed to get user');
        }

        const isValid = await argon2.verify(hashedPassword, password);

        if (!isValid) {
            console.log('Error [Bad Request Exception] Incorrect credentials');
            throw new RpcException('Incorrect credentials');
        }

        return {
            isValid,
        };
    }
}
