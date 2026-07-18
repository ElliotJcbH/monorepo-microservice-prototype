import { Controller } from '@nestjs/common';
import { SessionService } from './session.service';
import * as session from 'proto-gen/auth/v1/session';
import { Observable, of } from 'rxjs';

@Controller()
@session.SessionServiceControllerMethods()
export class SessionController implements session.SessionServiceController {
    constructor(private readonly sessionService: SessionService) {}

    grantSession(
        data: session.GrantSessionRequest,
    ): Promise<session.GrantSessionResponse> {
        return this.sessionService.grantSession(data);
    }

    revokeSession(
        data: session.RevokeSessionRequest,
    ): Promise<session.RevokeSessionResponse> {
        return this.sessionService.revokeSession(data);
    }

    verifySession(
        data: session.VerifySessionRequest,
    ): Promise<session.VerifySessionResponse> {
        return this.sessionService.verifySession(data);
    }

    renewSession(
        data: session.RenewSessionRequest,
    ): Promise<session.RenewSessionResponse> {
        return this.sessionService.renewSession(data);
    }
}
