import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { SessionModule } from './auth/session/session.module';
import { UserModule } from './user/user/user.module';

@Module({
    imports: [
        RouterModule.register([
            {
                path: 'auth',
                module: SessionModule,
            },
        ]),
        SessionModule,
        UserModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
