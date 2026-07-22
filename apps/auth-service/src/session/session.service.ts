import { Injectable } from '@nestjs/common';
import {
    GrantSessionRequest,
    GrantSessionResponse,
    RenewSessionRequest,
    RenewSessionResponse,
    RevokeSessionRequest,
    RevokeSessionResponse,
    VerifySessionRequest,
    VerifySessionResponse,
} from 'proto-gen/auth/v1/session_pb';
import { TokenService } from '../common/providers/token/token.service';

@Injectable()
export class SessionService {
    constructor(private tokenService: TokenService) {}

    async grantSession(
        request: GrantSessionRequest,
    ): Promise<GrantSessionResponse> {
        // return from(
        //     this.tokenService.createTokens('', request.email, request.password),
        // ).pipe(map((session) => ({ session })));
        return {
            session: await this.tokenService.createTokens(
                '',
                request.email,
                request.password,
            ),
        };
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
