
export class InvalidAccessTokenException extends Error {
    
    constructor(options?: { cause?: unknown }) {
        super(
            "The access token attached with the request is invalid and cannot be authenticated",
            {
                cause: options?.cause
            }
        );

        this.name = 'InvalidAccessTokenException';
        Object.setPrototypeOf(this, InvalidAccessTokenException.prototype);
    }
    
} 