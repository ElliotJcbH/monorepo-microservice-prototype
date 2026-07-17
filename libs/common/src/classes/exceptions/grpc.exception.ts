import { status } from '@grpc/grpc-js';

export class GrpcException extends Error {
    constructor(
        public readonly grpcCode: status,
        public readonly details: string,
    ) {
        super(details);
    }
}
