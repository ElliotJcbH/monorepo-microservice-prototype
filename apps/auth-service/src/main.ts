import { NestFactory } from '@nestjs/core';
import { AuthServiceAppModule } from './auth-service-app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Define other proto package services here
async function bootstrap() {

    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
        AuthServiceAppModule,
        {
            transport: Transport.GRPC,
            options: {
                package: 'auth',
                protoPath: [
                    join(process.cwd(), 'proto/auth/v1/session_pb.proto'),
                    join(process.cwd(), 'proto/auth/v1/password_pb.proto'),
                    join(process.cwd(), 'proto/auth/v1/well-known_pb.proto'),
                ], // TODO: Update to relative path with __dirname for compatibility with containerization?
                url: '0.0.0.0:5001',
            },
        },
    );

    const configService = app.get(ConfigService);

    app.useGlobalPipes(new ValidationPipe({
        disableErrorMessages: configService.get('ENVIRONMENT') == 'production' ? true : false, 
    }));
    await app.listen();
}
void bootstrap();
