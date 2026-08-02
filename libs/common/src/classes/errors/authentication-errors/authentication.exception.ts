import { DomainException as DomainException } from '../domain.exception.js';

export default class AuthenticationException extends DomainException {
    constructor(message: string, name: string, options?: ErrorOptions) {
        super(
            message || 'Encountered an authentication error.',
            name || 'AuthenticationError',
            options || {},
        );
    }
}
