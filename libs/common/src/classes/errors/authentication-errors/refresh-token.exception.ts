import AuthenticationException from './authentication.exception';

export class RefreshTokenException extends AuthenticationException {
    private userId: string = '';
    private jwtId: string = '';

    constructor(userId: string, jwtId: string, options?: ErrorOptions) {
        super(
            'The refresh token with this jwtId is invalid.',
            'RefreshTokenError',
            options,
        );

        this.userId = userId;
        this.jwtId = jwtId;
    }

    getUserId() {
        return this.userId;
    }

    getJwtId() {
        return this.jwtId;
    }
}
