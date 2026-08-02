import { DatabaseService } from '@app/common/providers/database/database.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PasswordRecordService {
    constructor(private readonly db: DatabaseService) {}

    async getWithEmail(email: string): Promise<string> {
        const query = `
            SELECT password FROM auth.users
            WHERE email = $1;
        `;

        const res = await this.db.queryOne<{ password: string }>(query, [
            email,
        ]);

        return res.password;
    }

    async insert(hashedPassword: string, userId: string): Promise<boolean> {
        const query = `
            INSERT INTO auth.users(password)
            VALUES ($1)
            WHERE user_id = $2
            RETURNING user_id
        `;

        const res = await this.db.queryOne<{ user_id: string }>(query, [
            hashedPassword,
            userId,
        ]);

        return res.user_id ? true : false;
    }
}
