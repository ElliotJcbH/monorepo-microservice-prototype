import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { AuthClientModule } from '@app/common/external-clients/auth-service/auth-client.module';

@Module({
    imports: [AuthClientModule],
    controllers: [SessionController],
    providers: [SessionService],
})
export class SessionModule {}
