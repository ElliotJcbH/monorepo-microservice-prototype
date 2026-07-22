import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

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
        console.log('Database connection closed successfully')
    }

    async query(text: string, params?: any[]) {
        return await this.pool.query(text, params);
    }

    async getClient() {
        return await this.pool.connect();
    }
}
