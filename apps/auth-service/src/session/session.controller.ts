import { Controller } from '@nestjs/common';
import { SessionService } from './session.service';
import * as session from 'proto-gen/auth/v1/session_pb';

@Controller()
@session.SessionServiceControllerMethods()
export class SessionController implements session.SessionServiceController {
    constructor(private readonly sessionService: SessionService) {}

    grantSession(
        request: session.GrantSessionRequest,
    ): Promise<session.GrantSessionResponse> {
        return this.sessionService.grantSession(request);
    }

    revokeSession(
        request: session.RevokeSessionRequest,
    ): Promise<session.RevokeSessionResponse> {
        return this.sessionService.revokeSession(request);
    }

    verifySession(
        request: session.VerifySessionRequest,
    ): session.VerifySessionResponse {
        return this.sessionService.verifySession(request);
    }

    renewSession(
        request: session.RenewSessionRequest,
    ): Promise<session.RenewSessionResponse> {
        return this.sessionService.renewSession(request);
    }
}
