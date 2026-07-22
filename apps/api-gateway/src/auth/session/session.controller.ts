import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { SessionService } from './session.service';
import { GrantSessionDto } from '../common/dtos/grant-session.dto';
import { SessionInfo } from 'proto-gen/auth/v1/session_pb';
import { Token } from '../common/decorators/token.decorator';
import { Cookies } from '../common/decorators/cookie.decorator';

@Controller('session')
export class SessionController {
    constructor(private readonly sessionService: SessionService) {}

    @Post()
    async grantSession(@Body() data: GrantSessionDto): Promise<SessionInfo> {
        return await this.sessionService.grantSession(data);
    }

    @Delete()
    async revokeSession(
        @Token() accessToken: string,
        @Cookies('refresh_token') refreshToken: string,
    ): Promise<boolean> {
        return await this.sessionService.revokeSession(
            accessToken,
            refreshToken,
        );
    }

    @Patch()
    async renewSession(
        @Token() accessToken: string,
        @Cookies('refresh_token') refreshToken: string,
    ): Promise<SessionInfo> {
        return await this.sessionService.renewSession(
            accessToken,
            refreshToken,
        );
    }

    @Get('/verify')
    async verifySession(@Token() accessToken: string): Promise<boolean> {
        return await this.sessionService.verifySession(accessToken);
    }
}
