export const ProtoServices = {
    SessionService: 'SessionService',
    UserService: 'UserService',
} as const;

export type ProtoService = (typeof ProtoServices)[keyof typeof ProtoServices];
