import { Module } from '@nestjs/common';
import { SessionModule } from './session/session.module';
import { TokenModule } from './common/providers/token/token.module';
import { WellKnownModule } from './well-known/well-known.module';
import { PasswordModule } from './password/password.module';

@Module({
    imports: [SessionModule, TokenModule, WellKnownModule, PasswordModule],
    controllers: [],
    providers: [],
})
export class AuthServiceAppModule {}
