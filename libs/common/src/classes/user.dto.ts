import { IUserRecord } from '../interfaces/user-record.interface';

type UserDtoImplementation = Pick<
    IUserRecord,
    'userId' | 'username' | 'email' | 'role' | 'isVerified' | 'createdAt'
>;

export class UserDto implements UserDtoImplementation {
    userId!: string;
    username!: string;
    email!: string;
    role!: string;
    isVerified!: boolean;
    createdAt!: Date;
}
