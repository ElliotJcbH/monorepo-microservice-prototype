import { NestFactory } from '@nestjs/core';
import { UserServiceModule } from './user-service.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
        UserServiceModule,
        {
            transport: Transport.GRPC,
            options: {
                package: 'user',
                protoPath: [
                    join(process.cwd(), 'proto/auth/v1/user_pb.proto'),
                ], // TODO: Update to relative path with __dirname for compatibility with containerization?
                url: '0.0.0.0:5002',
            },
        },
    );

    // const configService = app.get(ConfigService);

    // app.useGlobalPipes(new ValidationPipe({
    //     disableErrorMessages: configService.get('ENVIRONMENT') == 'production' ? true : false, 
    // }));
    // await app.listen();
}
void bootstrap();
