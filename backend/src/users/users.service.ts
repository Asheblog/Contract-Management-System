import { Injectable, ConflictException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async create(data: { email: string; password: string; name: string; role: string }) {
        const existing = await this.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existing) {
            throw new ConflictException('邮箱已存在');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        return this.prisma.user.create({
            data: {
                ...data,
                password: hashedPassword,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                createdAt: true,
            },
        });
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }

    async findById(id: number) {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                viewPreferences: true,
                createdAt: true,
            },
        });
    }

    async findAll() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateViewPreferences(userId: number, preferences: string[]) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { viewPreferences: JSON.stringify(preferences) },
        });
    }

    async getViewPreferences(userId: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { viewPreferences: true },
        });
        if (!user) throw new NotFoundException('用户不存在');
        return user.viewPreferences ? JSON.parse(user.viewPreferences) : null;
    }

    // 更新个人信息（用户自己）
    async updateProfile(userId: number, data: { name?: string }) {
        return this.prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
            },
        });
    }

    // 修改密码（需验证旧密码）
    async changePassword(userId: number, oldPassword: string, newPassword: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('用户不存在');

        const isValid = await bcrypt.compare(oldPassword, user.password);
        if (!isValid) {
            throw new BadRequestException('旧密码错误');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        return { message: '密码修改成功' };
    }

    // 更新头像
    async updateAvatar(userId: number, avatarPath: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { avatar: avatarPath },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
            },
        });
    }

    // 管理员更新用户信息
    async update(id: number, data: { email?: string; name?: string; role?: string }) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('用户不存在');

        // 如果要修改邮箱，检查新邮箱是否已被占用
        if (data.email && data.email !== user.email) {
            const existingUser = await this.prisma.user.findUnique({
                where: { email: data.email },
            });
            if (existingUser) {
                throw new ConflictException('该邮箱已被其他用户使用');
            }
        }

        return this.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                createdAt: true,
            },
        });
    }

    // 管理员重置密码
    async adminResetPassword(id: number, newPassword: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('用户不存在');

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });
        return { message: '密码重置成功' };
    }

    // 删除用户
    async delete(id: number, currentUserId: number) {
        if (id === currentUserId) {
            throw new ForbiddenException('不能删除自己');
        }
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('用户不存在');

        return this.prisma.user.delete({ where: { id } });
    }

    async updatePassword(userId: number, hashedPassword: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
    }
}

