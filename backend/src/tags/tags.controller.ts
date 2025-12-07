import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
    constructor(private prisma: PrismaService) { }

    @Get()
    async findAll() {
        return this.prisma.tag.findMany({
            orderBy: { name: 'asc' },
        });
    }

    @Post()
    async create(@Body() data: { name: string; color?: string }) {
        return this.prisma.tag.create({
            data: {
                name: data.name,
                color: data.color || '#1890ff',
            },
        });
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: { name?: string; color?: string }) {
        return this.prisma.tag.update({
            where: { id: parseInt(id) },
            data,
        });
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.prisma.tag.delete({
            where: { id: parseInt(id) },
        });
    }
}
