import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { SessionModule } from './auth/session/session.module';

@Module({
    imports: [
        RouterModule.register([
            {
                path: 'auth',
                module: SessionModule,
            },
        ]),
        SessionModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
