import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const Token = createParamDecorator(
    (context: ExecutionContext): string => {
        const req = context.switchToHttp().getRequest<Request>();
        const authorization = req.headers['authorization'] || '';
        const token = authorization.split(' ')[1];
        return token;
    },
);
