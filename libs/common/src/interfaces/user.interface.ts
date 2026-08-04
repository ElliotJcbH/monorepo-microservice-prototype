export interface IUserRecord {
    userId: string;
    username: string;
    email: string;
    role: string;
    isVerified: boolean;
    createdAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IUser extends Pick<
    IUserRecord,
    'userId' | 'username' | 'email' | 'role' | 'isVerified' | 'createdAt'
> {}
