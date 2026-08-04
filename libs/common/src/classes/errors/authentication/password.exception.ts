import AuthenticationException from './authentication.exception';

export class PasswordException extends AuthenticationException {
    private email!: string;
    private userId!: string;

    constructor(userId: string, email: string, options?: ErrorOptions) {
        super(
            'The password entered by the user is invalid.',
            'PasswordError',
            options,
        );

        this.userId = userId;
        this.email = email;
    }

    getUserId() {
        return this.userId;
    }

    getEmail() {
        return this.email;
    }
}
