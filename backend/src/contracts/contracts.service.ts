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

        await this.createAuditLog('create', contract.id, userId, {
            summary: '创建合同',
            fields: {
                '合同名称': dto.name,
                '合作方': dto.partner,
                '签订日期': dto.signDate,
                '到期日期': dto.expireDate,
                '状态': this.getStatusLabel(dto.status || 'active'),
            },
        });
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

        // 生成详细的变更记录
        const changes = this.generateChangeDetails(existing, dto);
        await this.createAuditLog('update', contract.id, userId, changes);
        return { ...contract, customData: JSON.parse(contract.customData || '{}') };
    }

    async markProcessed(id: number, userId: number) {
        const existing = await this.findOne(id);
        const contract = await this.prisma.contract.update({
            where: { id },
            data: { isProcessed: true },
        });
        await this.createAuditLog('process', id, userId, {
            summary: '标记为已处理',
            changes: [{
                field: '处理状态',
                from: '未处理',
                to: '已处理',
            }],
            contractName: existing.name,
        });
        return contract;
    }

    async delete(id: number, userId: number) {
        const existing = await this.findOne(id);
        await this.createAuditLog('delete', id, userId, {
            summary: '删除合同',
            deletedContract: {
                '合同名称': existing.name,
                '合作方': existing.partner,
                '签订日期': this.formatDate(existing.signDate),
                '到期日期': this.formatDate(existing.expireDate),
            },
        });
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

    // 生成详细的变更记录
    private generateChangeDetails(existing: any, dto: UpdateContractDto) {
        const changes: Array<{ field: string; from: string; to: string }> = [];
        const fieldLabels: Record<string, string> = {
            name: '合同名称',
            partner: '合作方',
            signDate: '签订日期',
            expireDate: '到期日期',
            status: '状态',
            isProcessed: '处理状态',
        };

        // 检查基础字段变更
        if (dto.name !== undefined && dto.name !== existing.name) {
            changes.push({ field: fieldLabels.name, from: existing.name, to: dto.name });
        }
        if (dto.partner !== undefined && dto.partner !== existing.partner) {
            changes.push({ field: fieldLabels.partner, from: existing.partner, to: dto.partner });
        }
        if (dto.signDate !== undefined) {
            const existingDate = this.formatDate(existing.signDate);
            const newDate = dto.signDate;
            if (existingDate !== newDate) {
                changes.push({ field: fieldLabels.signDate, from: existingDate, to: newDate });
            }
        }
        if (dto.expireDate !== undefined) {
            const existingDate = this.formatDate(existing.expireDate);
            const newDate = dto.expireDate;
            if (existingDate !== newDate) {
                changes.push({ field: fieldLabels.expireDate, from: existingDate, to: newDate });
            }
        }
        if (dto.status !== undefined && dto.status !== existing.status) {
            changes.push({
                field: fieldLabels.status,
                from: this.getStatusLabel(existing.status),
                to: this.getStatusLabel(dto.status),
            });
        }
        if (dto.isProcessed !== undefined && dto.isProcessed !== existing.isProcessed) {
            changes.push({
                field: fieldLabels.isProcessed,
                from: existing.isProcessed ? '已处理' : '未处理',
                to: dto.isProcessed ? '已处理' : '未处理',
            });
        }

        // 检查自定义字段变更
        if (dto.customData !== undefined) {
            const existingCustom = existing.customData || {};
            const newCustom = dto.customData || {};
            const allKeys = new Set([...Object.keys(existingCustom), ...Object.keys(newCustom)]);

            for (const key of allKeys) {
                const oldValue = existingCustom[key] ?? '';
                const newValue = newCustom[key] ?? '';
                if (String(oldValue) !== String(newValue)) {
                    changes.push({
                        field: key,
                        from: String(oldValue) || '(空)',
                        to: String(newValue) || '(空)',
                    });
                }
            }
        }

        return {
            summary: changes.length > 0 ? `更新了 ${changes.length} 个字段` : '无变更',
            changes,
            contractName: existing.name,
        };
    }

    private formatDate(date: Date | string): string {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }

    private getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            active: '进行中',
            archived: '已归档',
            void: '已作废',
        };
        return labels[status] || status;
    }

    // Contract Fields
    async getFields() {
        return this.prisma.contractField.findMany({ orderBy: { order: 'asc' } });
    }

    // 初始化系统默认字段
    async initSystemFields() {
        const systemFields = [
            { key: 'name', label: '合同名称', type: 'text', order: 1 },
            { key: 'partner', label: '合作方', type: 'text', order: 2 },
            { key: 'signDate', label: '签订日期', type: 'date', order: 3 },
            { key: 'expireDate', label: '到期日期', type: 'date', order: 4 },
            { key: 'status', label: '状态', type: 'text', order: 5 },
            { key: 'createdBy', label: '创建人', type: 'text', order: 6 },
        ];

        for (const field of systemFields) {
            const existing = await this.prisma.contractField.findUnique({
                where: { key: field.key },
            });
            if (!existing) {
                await this.prisma.contractField.create({
                    data: { ...field, isSystem: true, isVisible: true },
                });
            }
        }
    }

    async createField(data: { key: string; label: string; type: string }) {
        const maxOrder = await this.prisma.contractField.aggregate({ _max: { order: true } });
        return this.prisma.contractField.create({
            data: { ...data, isSystem: false, order: (maxOrder._max.order || 0) + 1 },
        });
    }

    async updateField(id: number, data: { label?: string; type?: string; isVisible?: boolean }) {
        return this.prisma.contractField.update({ where: { id }, data });
    }

    async deleteField(id: number) {
        const field = await this.prisma.contractField.findUnique({ where: { id } });
        if (field?.isSystem) {
            throw new Error('系统默认字段不可删除');
        }
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
