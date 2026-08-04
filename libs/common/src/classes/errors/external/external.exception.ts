import { DomainException } from "../domain.exception";

export class ExternalException extends DomainException {
    constructor(message: string, name: string, options?: ErrorOptions) {
        super(
            message || 'Something unexpected occured during an interaction with an external service or resource.',
            name || 'ExternalException',
            options || {},
        );
    }
}