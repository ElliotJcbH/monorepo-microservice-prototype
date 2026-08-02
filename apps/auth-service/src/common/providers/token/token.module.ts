import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { RefreshTokenRepository } from './refresh-token-record.service';

@Module({
    imports: [],
    providers: [TokenService, RefreshTokenRepository],
})
export class TokenModule {}
