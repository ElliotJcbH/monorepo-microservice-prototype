import { Controller, Delete, Get, Patch, Post, Put } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    createUser() {}

    @Get(':idOrEmail')
    getUser() {}

    @Patch()
    updateUser() {}

    @Put()
    updateUserData() {}

    @Delete()
    deleteUser() {}
}
