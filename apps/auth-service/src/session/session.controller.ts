import { Controller } from '@nestjs/common';
import { SessionService } from './session.service';
import * as session from 'proto-gen/auth/v1/session_pb';
import { GrantSessionRequestDto, RevokeSessionRequestDto } from '../common/dtos/auth-session-controller.dto';

@Controller()
@session.SessionServiceControllerMethods()
export class SessionController implements session.SessionServiceController {
    constructor(private readonly sessionService: SessionService) {}

    async grantSession(
        request: GrantSessionRequestDto,
    ): Promise<session.GrantSessionResponse> {
        const res = await this.sessionService.grantSession(
            request.email,
            request.password,
        );

        return {
            session: res,
        };
    }

    async revokeSession(
        request: RevokeSessionRequestDto,
    ): Promise<session.RevokeSessionResponse> {
        const isRevoked = await this.sessionService.revokeSession(
                request.accessToken,
                request.refreshToken,
            );        

        return {
            revoked: isRevoked,
        };
    }

    verifySession(
        request: session.VerifySessionRequest,
    ): session.VerifySessionResponse {
        const payload = this.sessionService.verifySession(
            request.accessToken,
        );

        return {
            valid: payload ? true : false,
        };
    }

    async renewSession(
        request: session.RenewSessionRequest,
    ): Promise<session.RenewSessionResponse> {
        const res = await this.sessionService.renewSession(
            request.accessToken,
            request.refreshToken
        );

        return {
            session: res
        }
    }
}
