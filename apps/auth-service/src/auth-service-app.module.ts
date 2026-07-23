import { Module } from '@nestjs/common';
import { SessionModule } from './session/session.module';
import { TokenModule } from './common/providers/token/token.module';
import { WellKnownModule } from './well-known/well-known.module';
import { PasswordModule } from './password/password.module';
import { DatabaseModule } from './common/providers/database/database.module';
import { UserClientModule } from './external/user-client/user-client.module';

@Module({
    imports: [SessionModule, TokenModule, WellKnownModule, PasswordModule, DatabaseModule, UserClientModule],
    controllers: [],
    providers: [],
})
export class AuthServiceAppModule {}
