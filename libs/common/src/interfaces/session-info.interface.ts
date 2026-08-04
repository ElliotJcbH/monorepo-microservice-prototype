import { IUser } from "./user.interface";

export interface ISessionInfo {
    accessToken: string;
    refreshToken: string;
    user: IUser;
    iat: number;
    exp: number;
}