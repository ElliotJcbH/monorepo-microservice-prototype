export const ProtoServices = {
    SessionService: 'SessionService',
} as const;

export type ProtoService = (typeof ProtoServices)[keyof typeof ProtoServices];
