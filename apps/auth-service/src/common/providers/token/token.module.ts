import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { RefreshTokenRecordService } from './refresh-token-record.service';

@Module({
  imports: [],
  providers: [TokenService, RefreshTokenRecordService]
})
export class TokenModule {}
