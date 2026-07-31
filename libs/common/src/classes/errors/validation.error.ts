export default class ValidationError extends Error {
    public code = 'ValidationError';

    constructor(options: ErrorOptions) {
        super(
            'Validation failed. Check the cause property for the comprehensive list of validation logic that did not pass.',
            options,
        );
        this.name = this.code;
    }

    appendCause(newCause: Record<string, string>) {
        this.cause = { ...(this.cause || {}), newCause };
    }
}
