import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DatabaseService } from '@app/common/providers/database/database.service';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

describe('UserService', () => {
    let service: UserService;
    let mockDb: { queryOne: jest.Mock<any> };

    beforeEach(async () => {
        mockDb = {
            queryOne: jest.fn(),
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: DatabaseService,
                    useValue: mockDb,
                },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create user', async () => {
        mockDb.queryOne.mockResolvedValue({
            user_id: 'abc-123',
            email: 'test@example.com',
            username: 'testuser',
            role: 'user',
            is_verified: false,
            created_at: new Date(),
        });

        const res = await service.createUser({
            email: 'test@example.com',
            password: 'hashed-pw',
            username: 'testuser',
        });

        expect(res).toHaveProperty('user');
        expect(res.user).toMatchObject({
            userId: expect.any(String),
            username: expect.any(String),
            email: expect.any(String),
            role: expect.any(String),
            isVerifed: expect.any(Boolean),
            createdAt: expect.any(Date),
        });

        expect(res.user!.email).toBe('test@example.com');

        expect(mockDb.queryOne).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO auth.users'),
            ['test@example.com', 'hashed-pw', 'testuser'],
        );
    });

    it('create user should throw rpc exception when user is falsy', async () => {
        mockDb.queryOne.mockResolvedValue(undefined);

        await expect(
            service.createUser({
                email: 'test@example.com',
                password: 'hashed-pw',
                username: 'testuser',
            }),
        ).rejects.toThrow(new RpcException({
            code: status.INTERNAL,
            message: "Failed to create user: no row returned"
        }));
    });

    it('should return a user with the given id', async () => {
        mockDb.queryOne.mockResolvedValue({
            user_id: 'abc-123',
            email: 'test@example.com',
            username: 'testuser',
            role: 'user',
            is_verified: false,
            created_at: new Date(),
        });

        const userId = 'abc-123';
        const res = await service.getUserById({ userId });

        expect(res.user?.userId).toBe(userId);
        expect(res.user).toMatchObject({
            userId: expect.any(String),
            username: expect.any(String),
            email: expect.any(String),
            role: expect.any(String),
            isVerifed: expect.any(Boolean),
            createdAt: expect.any(Date),
        });

        expect(mockDb.queryOne).toHaveBeenCalledWith(
            expect.stringContaining(`
                SELECT user_id, email, username, role, is_verified, created_at
                FROM auth.users
                WHERE user_id = $1
            `),
            [userId]
        );
    })

    it('should throw rpc exception on get user by id', async () => {
        mockDb.queryOne.mockResolvedValue(undefined);

        await expect(
            service.getUserById({
                userId: 'abc-123',
            }),
        ).rejects.toThrow(new RpcException({
            code: status.NOT_FOUND,
            message: "User does not exist"
        }));
    })

});
