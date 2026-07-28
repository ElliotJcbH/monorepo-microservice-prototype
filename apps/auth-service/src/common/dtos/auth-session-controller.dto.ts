import { IsEmail, IsJWT, IsString, IsStrongPassword } from "class-validator";
import { GrantSessionRequest, RevokeSessionRequest, VerifySessionRequest, RenewSessionRequest } from "proto-gen/auth/v1/session_pb";

export class GrantSessionRequestDto implements GrantSessionRequest {
    @IsEmail()
    email!: string;

    @IsStrongPassword()
    password!: string;
}

export class RevokeSessionRequestDto implements RevokeSessionRequest {
    @IsJWT()
    accessToken!: string;

    @IsString()
    refreshToken!: string;
}

export class VerifySessionRequestDto implements VerifySessionRequest {
    @IsJWT()
    accessToken!: string;
}

export class RenewSessionRequestDto implements RenewSessionRequest {
    @IsJWT()
    accessToken!: string;

    @IsString()
    refreshToken!: string;
}