export abstract class DomainException extends Error {
    constructor(message: string, name: string, options: ErrorOptions) {
        super(message, options);

        this.name = name;
    }

    appendCause(newCause: Record<string, string>) {
        this.cause = { ...(this.cause || {}), newCause };
    }
}
