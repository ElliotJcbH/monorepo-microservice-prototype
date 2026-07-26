import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DatabaseService } from '@app/common/providers/database/database.service';
import { TokenService } from '../common/providers/token/token.service';
import { PasswordService } from '../password/password.service';
import { of, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { fail } from 'assert';

describe('SessionService', () => {
    let service: SessionService;
    let mockDb: {
        query: jest.Mock<any>;
        queryOne: jest.Mock<any>;
    };
    let mockTokenService: {
        createTokens: jest.Mock<any>;
        verifyAccessToken: jest.Mock<any>;
    };
    let mockPasswordService: {
        verifyPassword: jest.Mock<any>;
    };
    let mockExtUserService: {
        getUserByEmail: jest.Mock<any>;
    };
    let mockUserClient: {
        getService: jest.Mock<any>;
    };

    beforeEach(async () => {
        mockDb = {
            query: jest.fn(),
            queryOne: jest.fn(),
        };
        mockTokenService = {
            createTokens: jest.fn(),
            verifyAccessToken: jest.fn(),
        };
        mockPasswordService = {
            verifyPassword: jest.fn(),
        };
        // this is what getService() returns
        mockExtUserService = {
            getUserByEmail: jest.fn(),
        };
        // this is the ClientGrpc-shaped mock
        mockUserClient = {
            getService: jest.fn().mockReturnValue(mockExtUserService),
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SessionService,
                {
                    provide: PasswordService,
                    useValue: mockPasswordService,
                },
                {
                    provide: TokenService,
                    useValue: mockTokenService,
                },
                {
                    provide: DatabaseService,
                    useValue: mockDb,
                },
                {
                    provide: 'USER_PACKAGE',
                    useValue: mockUserClient,
                },
            ],
        }).compile();

        service = module.get<SessionService>(SessionService);

        // TestingModule doesn't fire lifecycle hooks by default —
        // onModuleInit is what actually calls getService()
        await module.init();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('grant session should return valid session information', async () => {
        const now = new Date();
        mockPasswordService.verifyPassword.mockReturnValue({
            isValid: true,
        });
        mockExtUserService.getUserByEmail.mockReturnValue(
            of({
                user: {
                    userId: 'user-1',
                    username: 'rokketo',
                    email: 'test@example.com',
                    role: '',
                    isVerified: false,
                    createdAt: now,
                },
            }),
        );
        mockTokenService.createTokens.mockReturnValue({
            session: {},
        });

        const res = await service.grantSession({
            email: 'test@example.com',
            password: 'password',
        });

        expect(mockExtUserService.getUserByEmail).toHaveBeenCalledWith({
            email: 'test@example.com',
        });

        expect(res).toMatchObject({
            session: expect.anything(),
        });
    });

    it('grant session should throw rpc exception when user is falsy', async () => {
        mockPasswordService.verifyPassword.mockReturnValue({
            isValid: true,
        });
        mockExtUserService.getUserByEmail.mockReturnValue(of(undefined));
        mockTokenService.createTokens.mockReturnValue({
            session: {},
        });

        await expect(
            service.grantSession({
                email: 'test@example.com',
                password: 'password',
            }),
        ).rejects.toThrow(
            new RpcException({
                code: status.NOT_FOUND,
                message: 'User with that email does not exist',
            }),
        );
    });

    it('grant session should throw rpc exception when getUserByEmail fails', async () => {
        mockExtUserService.getUserByEmail.mockReturnValue(
            throwError(() => ({
                code: status.ABORTED,
                message: 'Failed to get there in time',
            })),
        );

        await expect(
            service.grantSession({
                email: 'test@example.com',
                password: 'correct-password',
            }),
        ).rejects.toThrow(
            new RpcException({
                code: status.ABORTED,
                message: 'Failed to get there in time',
            }),
        );
    });

    it('grant session should throw rpc exception when session is falsy', async () => {
        const now = new Date();
        mockExtUserService.getUserByEmail.mockReturnValue(
            of({
                user: {
                    userId: 'user-1',
                    username: 'rokketo',
                    email: 'test@example.com',
                    role: '',
                    isVerified: false,
                    createdAt: now,
                },
            }),
        );
        mockTokenService.createTokens.mockReturnValue(undefined);

        await expect(
            service.grantSession({
                email: 'test@example.com',
                password: 'correct-password',
            }),
        ).rejects.toThrow(
            new RpcException({
                code: status.UNKNOWN,
                message: 'Requested session is undefined',
            }),
        );
    });

    it('verify session should return a boolean', () => {
        mockTokenService.verifyAccessToken.mockReturnValue({
            user: {},
            sub: '',
        })

        const res = service.verifySession({
            accessToken: ''
        });

        expect(res).toHaveProperty('valid');
        expect(res.valid).toBeTruthy();
    })

    it.only('verify session should throw rpc exception when payload is falsy', () => {
        mockTokenService.verifyAccessToken.mockReturnValue(undefined);

        // toThrow does not work for comparing the error object properties
        try {
            service.verifySession({ accessToken: '' });
            fail('Expected verifySession to throw');
        } catch (err) {
            expect(err).toBeInstanceOf(RpcException);
            expect((err as RpcException).getError()).toEqual({
                code: status.UNKNOWN,
                message: 'Payload is not parseable',
            });
        }
    })
});
