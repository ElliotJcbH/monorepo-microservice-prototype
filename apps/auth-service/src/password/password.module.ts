import { Module } from '@nestjs/common';
import { PasswordService } from './password.service';
import { PasswordController } from './password.controller';
import { PasswordRecordService } from './password-record.service';

@Module({
    controllers: [PasswordController],
    providers: [PasswordService, PasswordRecordService],
})
export class PasswordModule {}
