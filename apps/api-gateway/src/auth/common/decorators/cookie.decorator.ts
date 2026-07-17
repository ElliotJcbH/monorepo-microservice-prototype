import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface RequestWithCookies extends Request {
    cookies: Record<string, string>;
}

export const Cookies = createParamDecorator(
    (cookieName: string | undefined, context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest<RequestWithCookies>();
        return cookieName ? req.cookies?.[cookieName] : req.cookies;
    },
);
