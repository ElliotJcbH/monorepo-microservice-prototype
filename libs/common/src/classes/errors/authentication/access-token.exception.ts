import AuthenticationException from './authentication.exception';

export type AccessTokenErrorCause = { title: string; description: string };

export class AcessTokenException extends AuthenticationException {
    private sub: string = '';
    private jti: string = '';

    constructor(sub: string, jti: string, options?: ErrorOptions) {
        super(
            'The auth token used to access a resource is invalid.',
            'AccessTokenError',
            options,
        );

        this.sub = sub;
        this.jti = jti;
    }

    getSub() {
        return this.sub;
    }

    getJti() {
        return this.jti;
    }
}
