import {
    Controller, Get, Post, Put, Delete, Body, Param,
    UseGuards, Request, UseInterceptors, UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import {
    CreateUserDto, UpdateUserDto, UpdateProfileDto,
    ChangePasswordDto, ResetPasswordDto
} from './dto/user.dto';

// 配置头像存储
const avatarStorage = diskStorage({
    destination: './uploads/avatars',
    filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        callback(null, `avatar-${uniqueSuffix}${extname(file.originalname)}`);
    },
});

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private usersService: UsersService) { }

    // ===== 个人中心接口 =====

    @Get('me')
    getProfile(@Request() req: any) {
        return this.usersService.findById(req.user.id);
    }

    @Put('me')
    updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
        return this.usersService.updateProfile(req.user.id, dto);
    }

    @Put('me/password')
    changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
        return this.usersService.changePassword(req.user.id, dto.oldPassword, dto.newPassword);
    }

    @Post('me/avatar')
    @UseInterceptors(FileInterceptor('file', {
        storage: avatarStorage,
        limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
                cb(new Error('只支持 JPG、PNG、GIF、WebP 格式图片'), false);
            } else {
                cb(null, true);
            }
        },
    }))
    uploadAvatar(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
        const avatarPath = `/uploads/avatars/${file.filename}`;
        return this.usersService.updateAvatar(req.user.id, avatarPath);
    }

    @Get('me/preferences')
    getPreferences(@Request() req: any) {
        return this.usersService.getViewPreferences(req.user.id);
    }

    @Put('me/preferences')
    updatePreferences(@Request() req: any, @Body() body: { columns: string[] }) {
        return this.usersService.updateViewPreferences(req.user.id, body.columns);
    }

    // ===== 管理员用户管理接口 =====

    @Get()
    @UseGuards(AdminGuard)
    findAll() {
        return this.usersService.findAll();
    }

    @Post()
    @UseGuards(AdminGuard)
    create(@Body() dto: CreateUserDto) {
        return this.usersService.create(dto);
    }

    @Put(':id')
    @UseGuards(AdminGuard)
    update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        return this.usersService.update(+id, dto);
    }

    @Post(':id/reset-password')
    @UseGuards(AdminGuard)
    resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
        return this.usersService.adminResetPassword(+id, dto.newPassword);
    }

    @Delete(':id')
    @UseGuards(AdminGuard)
    delete(@Param('id') id: string, @Request() req: any) {
        return this.usersService.delete(+id, req.user.id);
    }
}

