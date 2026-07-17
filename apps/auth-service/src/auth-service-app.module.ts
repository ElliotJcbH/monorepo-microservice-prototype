import { Module } from '@nestjs/common';
import { SessionModule } from './session/session.module';
import { TokenModule } from './common/providers/token/token.module';
import { WellKnownModule } from './well-known/well-known.module';

@Module({
    imports: [SessionModule, TokenModule, WellKnownModule],
    controllers: [],
    providers: [],
})
export class AuthServiceAppModule {}
