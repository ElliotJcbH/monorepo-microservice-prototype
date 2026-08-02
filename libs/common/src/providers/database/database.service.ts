import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { error } from 'console';
import { Pool, QueryResult, QueryResultRow, DatabaseError } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private pool!: Pool;

    constructor(private configService: ConfigService) {}

    async onModuleInit() {
        this.pool = new Pool({
            connectionString: this.configService.get<string>('PG_URL'),
        });

        try {
            const client = await this.pool.connect();
            console.log('Database connected successfully');
            client.release();
        } catch (err) {
            console.error('Database connection failed:', err);
            throw err;
        }
    }

    async onModuleDestroy() {
        await this.pool.end();
        console.log('Database connection closed successfully');
    }

    /**
     * @throws {Database Error} When it encounters an internal database error, also depending on whether queryRecovery can resolve it
     */
    async query<T extends QueryResultRow = QueryResultRow>(
        text: string,
        params?: unknown[],
    ): Promise<QueryResult<T>> {
        return await this.pool.query<T>(text, params);
    }

    async queryOne<T extends QueryResultRow = QueryResultRow>(
        text: string,
        params?: unknown[],
    ): Promise<T> {
        const res = await this.pool.query<T>(text, params);
        return res.rows[0];
    }

    async getClient() {
        return await this.pool.connect();
    }

}
