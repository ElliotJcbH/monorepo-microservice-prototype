import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { TokenModule } from '../common/providers/token/token.module';
import { JwtModule } from '@nestjs/jwt';
import KEY_CONFIG from '../common/configs/keys.config';

@Module({
    imports: [
        TokenModule,
        JwtModule.register({
            publicKey: KEY_CONFIG.keys.v1.public,
            privateKey: KEY_CONFIG.keys.v1.private,
            signOptions: {
                keyid: KEY_CONFIG.keyVersion,
                algorithm: 'RS256',
                expiresIn: `${KEY_CONFIG.accessTokenExpirationMs}ms`,
                jwtid: crypto.randomUUID(),
                issuer: '',
                audience: '',
            },
        }),
    ],
    controllers: [SessionController],
    providers: [SessionService],
})
export class SessionModule {}
