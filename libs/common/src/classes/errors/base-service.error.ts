import { HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

interface IProtocolError {
    http?: number | HttpException;
    grpc?: number | RpcException;
}

export interface BaseServiceErrorOptions extends ErrorOptions {
    protocolError?: IProtocolError;
}

export abstract class BaseServiceError extends Error {
    public protocolError;

    constructor(message: string, options: BaseServiceErrorOptions) {
        super(message || 'An error occured', {
            cause: options?.cause,
        });

        this.protocolError = options?.protocolError;
        Object.setPrototypeOf(this, BaseServiceError.prototype);
    }
}
