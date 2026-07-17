import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class GrantSessionDto {
    @IsEmail()
    email: string;

    @IsString()
    username: string;

    @IsStrongPassword()
    password: string;
}
