import { Injectable } from '@nestjs/common';
import {
    GrantSessionRequest,
    GrantSessionResponse,
    RenewSessionRequest,
    RenewSessionResponse,
    RevokeSessionRequest,
    RevokeSessionResponse,
    SessionServiceClient,
    VerifySessionRequest,
    VerifySessionResponse,
} from 'proto-gen/auth/v1/session';
import { Observable } from 'rxjs';

@Injectable()
export class SessionService implements SessionServiceClient {
    grantSession(
        request: GrantSessionRequest,
    ): Observable<GrantSessionResponse> {
        throw new Error('Method not implemented.');
    }
    verifySession(
        request: VerifySessionRequest,
    ): Observable<VerifySessionResponse> {
        throw new Error('Method not implemented.');
    }
    revokeSession(
        request: RevokeSessionRequest,
    ): Observable<RevokeSessionResponse> {
        throw new Error('Method not implemented.');
    }
    renewSession(
        request: RenewSessionRequest,
    ): Observable<RenewSessionResponse> {
        throw new Error('Method not implemented.');
    }
}
