import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto';

@Controller('api')
export class UserController {
  constructor(private userService: UserService) {}
  @Get('user/:id')
  getUser(@Param('id', ParseIntPipe) userId: number) {
    return this.userService.getUser(userId);
  }

  @Get('user/:id/avatar')
  getUserAvatar(@Param('id', ParseIntPipe) userId: number) {
    return this.userService.getUserAvatar(userId);
  }

  @Post('users')
  createUser(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @Delete('user/:id/avatar')
  deletUserAvatar(@Param('id', ParseIntPipe) userId: number) {
    return this.userService.deleteUserAvatar(userId);
  }
}
