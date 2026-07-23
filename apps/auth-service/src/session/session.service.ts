import { Injectable } from '@nestjs/common';
import {
    GrantSessionRequest,
    GrantSessionResponse,
    RenewSessionRequest,
    RenewSessionResponse,
    RevokeSessionRequest,
    RevokeSessionResponse,
    SessionUserInfo,
    VerifySessionRequest,
    VerifySessionResponse,
} from 'proto-gen/auth/v1/session_pb';
import { TokenService } from '../common/providers/token/token.service';
import { DatabaseService } from '../common/providers/database/database.service';
import { PasswordService } from '../password/password.service';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class SessionService {
    constructor(
        private tokenService: TokenService,
        private passwordService: PasswordService,
        private db: DatabaseService,
    ) {}

    async grantSession(
        request: GrantSessionRequest,
    ): Promise<GrantSessionResponse> {
        // never mind this should all be in api gateway, no>
        // await this.passwordService.verifyPassword(request);
        // const user = this.userServiceClient.getUserSession();

        const userData: SessionUserInfo = {
            userId: '',
            username: '',
            email: '',
            role: '',
            isVerifed: false,
            createdAt: undefined
        };

        return {
            session: await this.tokenService.createTokens(
                userData
            ),
        };

        // return from(
        //     this.tokenService.createTokens('', request.email, request.password),
        // ).pipe(map((session) => ({ session })));
    }

    verifySession(
        request: VerifySessionRequest,
    ): Promise<VerifySessionResponse> {
        throw new Error('Method not implemented.');
    }

    revokeSession(
        request: RevokeSessionRequest,
    ): Promise<RevokeSessionResponse> {
        throw new Error('Method not implemented.');
    }

    renewSession(request: RenewSessionRequest): Promise<RenewSessionResponse> {
        throw new Error('Method not implemented.');
    }
}
