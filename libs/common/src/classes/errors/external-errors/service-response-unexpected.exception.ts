import { ExternalException } from './external.exception';

export class ServiceResponseUnexpectedException extends ExternalException {
    public expected: unknown = '';
    public received: unknown = ''

    /**
     * @param expected Refers to the shape (e.g., "User { userId: '123', name: 'Nest' }") or value of the data that was expected
     * @param received The payload (formatted as a string)
     */
    constructor(expected: string, received: string, options?: ErrorOptions) {
        super(
            `
            An outbound request to another service returned an empty, incomplete, or invalid value but expected to 
            receive data critical to finish procedure. Expected ${expected} but got ${received}
            `,
            'ServiceResponseUnexpectedException',
            options,
        );

        this.expected = expected;
        this.received = received;
    }
}
