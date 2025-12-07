import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto, UpdateContractDto, ContractQueryDto } from './dto/contract.dto';

@Injectable()
export class ContractsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateContractDto, userId: number) {
        const contract = await this.prisma.contract.create({
            data: {
                name: dto.name,
                partner: dto.partner,
                signDate: new Date(dto.signDate),
                expireDate: new Date(dto.expireDate),
                status: dto.status || 'active',
                customData: dto.customData ? JSON.stringify(dto.customData) : '{}',
                createdById: userId,
            },
            include: { attachments: true, createdBy: { select: { id: true, name: true, email: true } } },
        });

        await this.createAuditLog('create', contract.id, userId, { action: 'Created contract' });
        return contract;
    }

    async findAll(query: ContractQueryDto) {
        const { status, search, page = 1, limit = 20, sortField, sortOrder } = query;
        const where: any = {};

        if (status) {
            if (status === 'expiring') {
                const thirtyDaysLater = new Date();
                thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
                where.expireDate = { lte: thirtyDaysLater, gte: new Date() };
                where.status = 'active';
            } else if (status === 'expired') {
                where.expireDate = { lt: new Date() };
                where.status = 'active';
            } else if (status === 'unprocessed') {
                where.expireDate = { lt: new Date() };
                where.isProcessed = false;
            } else {
                where.status = status;
            }
        }

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { partner: { contains: search } },
            ];
        }

        // 构建排序条件
        const validSortFields = ['name', 'partner', 'signDate', 'expireDate', 'status', 'createdAt'];
        let orderBy: any = { expireDate: 'asc' }; // 默认按到期日期升序
        if (sortField && validSortFields.includes(sortField)) {
            orderBy = { [sortField]: sortOrder || 'asc' };
        }

        const [contracts, total] = await Promise.all([
            this.prisma.contract.findMany({
                where,
                include: {
                    attachments: true,
                    createdBy: { select: { id: true, name: true, email: true } },
                },
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.contract.count({ where }),
        ]);

        return {
            data: contracts.map(c => ({
                ...c,
                customData: JSON.parse(c.customData || '{}'),
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: number) {
        const contract = await this.prisma.contract.findUnique({
            where: { id },
            include: {
                attachments: true,
                createdBy: { select: { id: true, name: true, email: true } },
                logs: {
                    include: { user: { select: { id: true, name: true } } },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!contract) throw new NotFoundException('Contract not found');
        return {
            ...contract,
            customData: JSON.parse(contract.customData || '{}'),
        };
    }

    async update(id: number, dto: UpdateContractDto, userId: number) {
        const existing = await this.findOne(id);

        const contract = await this.prisma.contract.update({
            where: { id },
            data: {
                name: dto.name,
                partner: dto.partner,
                signDate: dto.signDate ? new Date(dto.signDate) : undefined,
                expireDate: dto.expireDate ? new Date(dto.expireDate) : undefined,
                status: dto.status,
                isProcessed: dto.isProcessed,
                customData: dto.customData ? JSON.stringify(dto.customData) : undefined,
            },
            include: {
                attachments: true,
                createdBy: { select: { id: true, name: true, email: true } },
            },
        });

        await this.createAuditLog('update', contract.id, userId, { before: existing, after: contract });
        return { ...contract, customData: JSON.parse(contract.customData || '{}') };
    }

    async markProcessed(id: number, userId: number) {
        const contract = await this.prisma.contract.update({
            where: { id },
            data: { isProcessed: true },
        });
        await this.createAuditLog('process', id, userId, { action: 'Marked as processed' });
        return contract;
    }

    async delete(id: number, userId: number) {
        await this.createAuditLog('delete', id, userId, { action: 'Deleted contract' });
        return this.prisma.contract.delete({ where: { id } });
    }

    async getExpiring(days: number = 30) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        return this.prisma.contract.findMany({
            where: {
                status: 'active',
                isProcessed: false,
                expireDate: { lte: futureDate },
            },
            include: { createdBy: { select: { id: true, name: true, email: true } } },
            orderBy: { expireDate: 'asc' },
        });
    }

    async getUnprocessedExpired() {
        return this.prisma.contract.findMany({
            where: {
                status: 'active',
                isProcessed: false,
                expireDate: { lt: new Date() },
            },
            include: { createdBy: { select: { id: true, name: true, email: true } } },
        });
    }

    private async createAuditLog(action: string, contractId: number, userId: number, details: any) {
        return this.prisma.auditLog.create({
            data: {
                action,
                contractId,
                userId,
                details: JSON.stringify(details),
            },
        });
    }

    // Contract Fields
    async getFields() {
        return this.prisma.contractField.findMany({ orderBy: { order: 'asc' } });
    }

    async createField(data: { key: string; label: string; type: string }) {
        const maxOrder = await this.prisma.contractField.aggregate({ _max: { order: true } });
        return this.prisma.contractField.create({
            data: { ...data, order: (maxOrder._max.order || 0) + 1 },
        });
    }

    async updateField(id: number, data: { label?: string; type?: string; isVisible?: boolean }) {
        return this.prisma.contractField.update({ where: { id }, data });
    }

    async deleteField(id: number) {
        return this.prisma.contractField.delete({ where: { id } });
    }

    async findByIds(ids: number[]) {
        return this.prisma.contract.findMany({
            where: { id: { in: ids } },
            include: {
                attachments: true,
                createdBy: { select: { id: true, name: true, email: true } },
            },
        });
    }

    async getStats() {
        const now = new Date();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(now.getDate() + 30);

        const [total, active, expiring, expired, processed] = await Promise.all([
            this.prisma.contract.count(),
            this.prisma.contract.count({ where: { status: 'active' } }),
            this.prisma.contract.count({
                where: {
                    status: 'active',
                    isProcessed: false,
                    expireDate: { lte: thirtyDaysLater, gte: now },
                },
            }),
            this.prisma.contract.count({
                where: {
                    status: 'active',
                    isProcessed: false,
                    expireDate: { lt: now },
                },
            }),
            this.prisma.contract.count({ where: { isProcessed: true } }),
        ]);

        // Status distribution
        const statusDistribution = [
            { type: '进行中', value: active - expiring },
            { type: '即将到期', value: expiring },
            { type: '已过期', value: expired },
            { type: '已归档', value: await this.prisma.contract.count({ where: { status: 'archived' } }) },
        ];

        // Expiry trend (next 6 months)
        const expiryTrend: { month: string; count: number }[] = [];
        for (let i = 0; i < 6; i++) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
            const count = await this.prisma.contract.count({
                where: {
                    expireDate: { gte: monthStart, lte: monthEnd },
                },
            });
            expiryTrend.push({
                month: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
                count,
            });
        }

        return {
            totalContracts: total,
            activeContracts: active,
            expiringContracts: expiring,
            expiredContracts: expired,
            processedContracts: processed,
            statusDistribution,
            expiryTrend,
        };
    }
}
