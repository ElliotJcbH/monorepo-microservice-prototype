import { status } from '@grpc/grpc-js';
import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { GrpcException } from '@app/common/classes/errors/grpc.exception';

@Catch(GrpcException)
export class GrpcToHttpExceptionFilter implements ExceptionFilter {
    catch(exception: GrpcException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;

        switch (exception.grpcCode) {
            case status.INVALID_ARGUMENT:
                httpStatus = HttpStatus.BAD_REQUEST;
                break;
            case status.UNAUTHENTICATED:
                httpStatus = HttpStatus.UNAUTHORIZED;
                break;
            case status.PERMISSION_DENIED:
                httpStatus = HttpStatus.FORBIDDEN;
                break;
            case status.NOT_FOUND:
                httpStatus = HttpStatus.NOT_FOUND;
                break;
            case status.ALREADY_EXISTS:
                httpStatus = HttpStatus.CONFLICT;
                break;
            case status.DEADLINE_EXCEEDED:
                httpStatus = HttpStatus.REQUEST_TIMEOUT;
                break;
        }

        response.status(httpStatus).json({
            statusCode: httpStatus,
            message: exception.details || exception.message,
            error: HttpStatus[httpStatus],
        });
    }
}
