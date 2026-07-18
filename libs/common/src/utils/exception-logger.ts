import { ServiceError } from '@grpc/grpc-js';

export function logGrpcException(err: ServiceError) {
    console.error('Error', '[gRPC Error]:', err.code, err.details);
}
