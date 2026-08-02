import { DomainException } from '../domain.exception.js';

export default class ValidationException extends DomainException {
    constructor(message: string, name: string, options?: ErrorOptions) {
        super(
            message ||
                'Validation failed. Check the cause property for the comprehensive list of validation logic that did not pass.',
            name || 'ValidationError',
            options || {},
        );
    }
}
