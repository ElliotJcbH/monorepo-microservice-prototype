import { status } from '@grpc/grpc-js';
import { BaseServiceError } from './base-service.error';
import { UnauthorizedException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export class InvalidAccessTokenException extends BaseServiceError {
    constructor(options?: ErrorOptions) {
        super(
            'The access token attached with the request is invalid and cannot be authenticated',
            {
                cause: options?.cause,
                protocolError: {
                    http: new UnauthorizedException(''),
                    grpc: new RpcException({ code: status.UNAUTHENTICATED, message: '' }),
                },
            },
        );

        this.name = 'InvalidAccessTokenException';
        Object.setPrototypeOf(this, InvalidAccessTokenException.prototype);
    }
}
