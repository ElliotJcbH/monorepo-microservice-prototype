import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { error } from 'console';
import { Pool, QueryResult, QueryResultRow, DatabaseError } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private pool!: Pool;
    // private recoverableCodes = ['40001', '40P01'];

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
        // let res: QueryResult<T>;
        // try {
        //     res = await this.pool.query<T>(text, params);
        // } catch (err: unknown) {
        //     if (err instanceof DatabaseError)
        //         this.handleQueryRecoveryStrategy(err);
        //     throw err;
        // }
        // return res;
    }

    async queryOne<T extends QueryResultRow = QueryResultRow>(
        text: string,
        params?: unknown[],
    ): Promise<T> {
        const res = await this.pool.query<T>(text, params);
        return res.rows[0];
        // let row: T;
        // try {
        //     const res = await this.pool.query<T>(text, params);
        //     row = res.rows[0];
        // } catch (err: unknown) {
        //     if (err instanceof DatabaseError)
        //         this.handleQueryRecoveryStrategy(err);
        //     throw err;
        // }
        // return row;
    }

    async getClient() {
        return await this.pool.connect();
    }

}
