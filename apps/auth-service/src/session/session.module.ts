import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { TokenModule } from '../common/providers/token/token.module';
import { PasswordModule } from '../password/password.module';
import { UserClientModule } from '@app/common/external-clients/user-service/user-client.module';

@Module({
    imports: [
        TokenModule,
        PasswordModule,
        UserClientModule,
    ],
    controllers: [SessionController],
    providers: [SessionService],
})
export class SessionModule {}
