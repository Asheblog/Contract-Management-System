import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsIn } from 'class-validator';

export class CreateUserDto {
    @IsEmail({}, { message: '请输入有效的邮箱地址' })
    email: string;

    @IsNotEmpty({ message: '密码不能为空' })
    @MinLength(6, { message: '密码至少6个字符' })
    password: string;

    @IsNotEmpty({ message: '姓名不能为空' })
    @IsString()
    name: string;

    @IsIn(['admin', 'user'], { message: '角色必须是 admin 或 user' })
    role: string;
}

export class UpdateUserDto {
    @IsOptional()
    @IsEmail({}, { message: '请输入有效的邮箱地址' })
    email?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsIn(['admin', 'user'], { message: '角色必须是 admin 或 user' })
    role?: string;
}

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: '姓名不能为空' })
    name?: string;
}

export class ChangePasswordDto {
    @IsNotEmpty({ message: '旧密码不能为空' })
    oldPassword: string;

    @IsNotEmpty({ message: '新密码不能为空' })
    @MinLength(6, { message: '新密码至少6个字符' })
    newPassword: string;
}

export class ResetPasswordDto {
    @IsNotEmpty({ message: '新密码不能为空' })
    @MinLength(6, { message: '新密码至少6个字符' })
    newPassword: string;
}
