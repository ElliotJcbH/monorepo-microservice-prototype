import { Controller } from '@nestjs/common';
import { PasswordService } from './password.service';
import * as password from 'proto-gen/auth/v1/password_pb';

@Controller()
@password.PasswordServiceControllerMethods()
export class PasswordController implements password.PasswordServiceController {
    constructor(private readonly passwordService: PasswordService) {}

    storePassword(
        request: password.StorePasswordRequest,
    ): Promise<password.StorePasswordResponse> {
        return this.passwordService.storePassword(request);
    }

    verifyPassword(
        request: password.VerifyPasswordRequest,
    ): Promise<password.VerifyPasswordResponse> {
        return this.passwordService.verifyPassword(request);
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
