import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PasswordException } from '@app/common/classes/errors/authentication/password.exception';
import { PasswordRecordService } from './password-record.service';

@Injectable()
export class PasswordService {
    constructor(private passwordRecordService: PasswordRecordService) {}

    async storePassword(userId: string, password: string): Promise<boolean> {
        const hashedPassword = await argon2.hash(password);
        if (await this.passwordRecordService.insert(hashedPassword, userId))
            return true;

        throw new PasswordException(userId, '');
    }

    async verifyPassword(email: string, password: string): Promise<boolean> {
        const hashedPassword =
            await this.passwordRecordService.getWithEmail(email);

        const isValid = await argon2.verify(hashedPassword, password);

        if (!isValid) throw new PasswordException('', email);

        return isValid;
    }
}
