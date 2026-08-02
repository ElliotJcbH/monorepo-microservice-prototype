import { Module } from '@nestjs/common';
import { SessionModule } from './session/session.module';
import { TokenModule } from './common/providers/token/token.module';
import { WellKnownModule } from './well-known/well-known.module';
import { PasswordModule } from './password/password.module';
import { UserClientModule } from '@app/common/external-clients/user-service/user-client.module';
import { DatabaseModule } from '@app/common/providers/database/database.module';
import { JwtModule } from '@nestjs/jwt';
import KEY_CONFIG from './common/configs/keys.config';

@Module({
    imports: [
        SessionModule,
        TokenModule,
        WellKnownModule,
        PasswordModule,
        /** EXTERNAL CLIENTS */
        UserClientModule,

        /** GLOBALS */
        DatabaseModule, // This is a repo-wide provider
        {
            ...JwtModule.register({
                publicKey: KEY_CONFIG.keys.v1.public,
                privateKey: KEY_CONFIG.keys.v1.private,
                signOptions: {
                    keyid: KEY_CONFIG.keyVersion,
                    algorithm: 'RS256',
                    expiresIn: `${KEY_CONFIG.accessTokenExpirationMs}ms`,
                    issuer: '',
                    audience: '',
                },
            }),
            global: true
        }
    ],
    controllers: [],
    providers: [],
})
export class AuthServiceAppModule {}
