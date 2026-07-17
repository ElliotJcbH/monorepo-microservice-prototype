import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { AuthClientModule } from '../auth-client.module';

@Module({
    imports: [AuthClientModule],
    controllers: [SessionController],
    providers: [SessionService],
})
export class SessionModule {}
