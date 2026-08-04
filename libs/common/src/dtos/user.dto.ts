import { IUser } from '../interfaces/user.interface';

export class UserDto implements IUser {
    userId!: string;
    username!: string;
    email!: string;
    role!: string;
    isVerified!: boolean;
    createdAt!: Date;
}
