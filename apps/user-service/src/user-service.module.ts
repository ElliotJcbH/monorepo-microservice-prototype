import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { DatabaseModule } from '@app/common/providers/database/database.module';

@Module({
  imports: [
    UserModule,
    DatabaseModule
  ],
  controllers: [],
  providers: [],
})
export class UserServiceModule {}
