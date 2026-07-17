import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { GrpcToHttpExceptionFilter } from './auth/common/filters/grpc-to-http-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // Strips out any properties not explicitly defined in the DTO
            forbidNonWhitelisted: true, // Throws an error if forbidden/extra properties are provided
            transform: true, // Automatically converts plain payloads into network-typed DTO instances
        }),
    );

    app.useGlobalFilters(new GrpcToHttpExceptionFilter());

    app.use(cookieParser());

    await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
