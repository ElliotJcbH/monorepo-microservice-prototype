import { DatabaseService } from '@app/common/providers/database/database.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RefreshTokenRecordService {
    constructor(private readonly db: DatabaseService) {}

    async get(jwtId: string): Promise<{
        refresh_token: string;
        expires_at: Date;
    }> {
        const query = `
                SELECT refresh_token, expires_at FROM auth.refresh_tokens
                WHERE jwt_id = $1
            `;

        const res = await this.db.queryOne<{
            refresh_token: string;
            expires_at: Date;
        }>(query, [jwtId]);

        return res;
    }

    async insert(
        jwtId: string,
        userId: string,
        hash: string,
        expiresAt: Date,
    ): Promise<string> {
        const query = `
            INSERT INTO auth.refresh_tokens(jwt_id, user_id, refresh_token, expires_at) 
            VALUES ($1, $2, $3, $4)
            RETURNING jwt_id
        `;

        const res = await this.db.queryOne<{ jwt_id: string }>(query, [
            jwtId,
            userId,
            hash,
            expiresAt,
        ]);

        return res.jwt_id;
    }

    async update(currentJwtId: string, newJwtId: string): Promise<string> {
        const query = `
            UPDATE auth.refresh_tokens
            SET COLUMN jwt_id = $1
            WHERE jwt_id = $2
            RETURNING jwt_id
        `;
        const res = await this.db.queryOne<{ jwt_id: string }>(query, [
            newJwtId,
            currentJwtId,
        ]);

        return res.jwt_id;
    }

    async delete(jwtId: string): Promise<string> {
        const query = `
            DELETE FROM auth.refresh_tokens
            WHERE jwt_id = $1
            RETURNING jwt_id
        `;

        const res = await this.db.queryOne<{ jwt_id: string }>(query, [jwtId]);

        return res.jwt_id;
    }
}
