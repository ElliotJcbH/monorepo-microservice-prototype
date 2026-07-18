import { Controller } from '@nestjs/common';
import { PasswordService } from './password.service';

@Controller()
export class PasswordController {
  constructor(private readonly passwordService: PasswordService) {}
}
