import { Controller } from '@nestjs/common';
import { PasswordService } from './password.service';
import * as password from 'proto-gen/auth/v1/password_pb';

@Controller()
@password.PasswordServiceControllerMethods()
export class PasswordController implements password.PasswordServiceController {
    constructor(private readonly passwordService: PasswordService) {}

    async storePassword(
        request: password.StorePasswordRequest,
    ): Promise<password.StorePasswordResponse> {
        const res = await this.passwordService.storePassword(
            request.userId,
            request.password,
        );
        return {
            isStored: res,
        };
    }

    async verifyPassword(
        request: password.VerifyPasswordRequest,
    ): Promise<password.VerifyPasswordResponse> {
        const res = await this.passwordService.storePassword(
            request.email,
            request.password,
        );
        return {
            isValid: res,
        };
    }

    getChangePasswordToken(
        request: password.GetChangePasswordTokenRequest,
    ): Promise<password.GetChangePasswordTokenResponse> {
        throw new Error('Method not implemented.');
    }

    changePassword(
        request: password.ChangePasswordRequest,
    ): Promise<password.ChangePasswordResponse> {
        throw new Error('Method not implemented.');
    }
}
