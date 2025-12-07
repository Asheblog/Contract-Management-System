import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    private resetTokens = new Map<string, { userId: number; expires: Date }>();

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.usersService.create({
            email: dto.email,
            password: hashedPassword,
            name: dto.name,
            role: 'user',
        });

        return this.generateToken(user);
    }

    async login(dto: LoginDto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user) {
            throw new UnauthorizedException('邮箱或密码错误');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('邮箱或密码错误');
        }

        return this.generateToken(user);
    }

    private generateToken(user: any) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };
    }

    async validateUser(userId: number) {
        return this.usersService.findById(userId);
    }

    async requestPasswordReset(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            // Don't reveal if email exists
            return { message: '如果邮箱存在，重置链接已发送' };
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date();
        expires.setHours(expires.getHours() + 1); // Token valid for 1 hour

        this.resetTokens.set(token, { userId: user.id, expires });

        // In production, send email with reset link
        // For now, just return success
        console.log(`Password reset token for ${email}: ${token}`);

        return { message: '如果邮箱存在，重置链接已发送' };
    }

    async resetPassword(token: string, newPassword: string) {
        const tokenData = this.resetTokens.get(token);

        if (!tokenData || tokenData.expires < new Date()) {
            this.resetTokens.delete(token);
            throw new BadRequestException('重置链接已过期或无效');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.usersService.updatePassword(tokenData.userId, hashedPassword);
        this.resetTokens.delete(token);

        return { message: '密码重置成功' };
    }
}

