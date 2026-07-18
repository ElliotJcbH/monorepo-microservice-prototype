import { NestFactory } from '@nestjs/core';
import { AuthServiceAppModule } from './auth-service-app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'path';

// Define other proto package services here
async function bootstrap() {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
        AuthServiceAppModule,
        {
            transport: Transport.GRPC,
            options: {
                package: 'auth',
                protoPath: [
                    join(process.cwd(), 'proto/auth/session.proto'),
                    join(process.cwd(), 'proto/auth/password.proto'),
                    join(process.cwd(), 'proto/auth/well-known.proto'),
                ], // TODO: Update to relative path with __dirname for compatibility with containerization?
                url: '0.0.0.0:5001',
            },
        },
    );
    await app.listen();
}
void bootstrap();
