import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContractsService } from './contracts.service';
import { CreateContractDto, UpdateContractDto, ContractQueryDto } from './dto/contract.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
    constructor(private contractsService: ContractsService) { }

    @Post()
    create(@Body() dto: CreateContractDto, @Request() req: any) {
        return this.contractsService.create(dto, req.user.id);
    }

    @Get()
    findAll(@Query() query: ContractQueryDto) {
        return this.contractsService.findAll(query);
    }

    @Get('stats')
    async getStats() {
        return this.contractsService.getStats();
    }

    @Get('expiring')
    getExpiring(@Query('days') days?: string) {
        return this.contractsService.getExpiring(days ? parseInt(days) : 30);
    }

    @Get('unprocessed')
    getUnprocessed() {
        return this.contractsService.getUnprocessedExpired();
    }

    @Get('export')
    async exportToExcel(@Res() res: Response, @Query('ids') ids?: string) {
        const [contractsResult, fields] = await Promise.all([
            ids
                ? this.contractsService.findByIds(ids.split(',').map(Number))
                : this.contractsService.findAll({ page: 1, limit: 1000 }),
            this.contractsService.getFields(),
        ]);

        const contracts = ids ? contractsResult : (contractsResult as any).data;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('合同列表');

        // 基础列
        const baseColumns = [
            { header: '合同名称', key: 'name', width: 30 },
            { header: '合作方', key: 'partner', width: 25 },
            { header: '签订日期', key: 'signDate', width: 15 },
            { header: '到期日期', key: 'expireDate', width: 15 },
            { header: '状态', key: 'status', width: 10 },
            { header: '已处理', key: 'isProcessed', width: 10 },
        ];

        // 动态添加自定义字段列
        const customColumns = fields.map(field => ({
            header: field.label,
            key: `custom_${field.key}`,
            width: 20,
        }));

        worksheet.columns = [...baseColumns, ...customColumns];

        contracts.forEach((contract: any) => {
            const customData = typeof contract.customData === 'string'
                ? JSON.parse(contract.customData || '{}')
                : (contract.customData || {});

            const rowData: any = {
                name: contract.name,
                partner: contract.partner,
                signDate: contract.signDate instanceof Date
                    ? contract.signDate.toISOString().split('T')[0]
                    : contract.signDate?.split('T')[0],
                expireDate: contract.expireDate instanceof Date
                    ? contract.expireDate.toISOString().split('T')[0]
                    : contract.expireDate?.split('T')[0],
                status: contract.status === 'active' ? '进行中' : contract.status === 'archived' ? '已归档' : '已作废',
                isProcessed: contract.isProcessed ? '是' : '否',
            };

            // 添加自定义字段数据
            fields.forEach(field => {
                rowData[`custom_${field.key}`] = customData[field.key] ?? '';
            });

            worksheet.addRow(rowData);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=contracts.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    }

    @Get('import/template')
    async downloadImportTemplate(@Res() res: Response) {
        // 获取自定义字段
        const fields = await this.contractsService.getFields();

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('合同导入模板');

        // 基础列
        const baseColumns = [
            { header: '合同名称 *', key: 'name', width: 30 },
            { header: '合作方 *', key: 'partner', width: 25 },
            { header: '签订日期 * (YYYY-MM-DD)', key: 'signDate', width: 25 },
            { header: '到期日期 * (YYYY-MM-DD)', key: 'expireDate', width: 25 },
            { header: '备注', key: 'notes', width: 40 },
        ];

        // 动态添加自定义字段列
        const customColumns = fields.map(field => ({
            header: field.type === 'date' ? `${field.label} (YYYY-MM-DD)` : field.label,
            key: `custom_${field.key}`,
            width: 20,
        }));

        worksheet.columns = [...baseColumns, ...customColumns];

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };

        // Add example row
        const exampleRow: any = {
            name: '示例合同-请删除此行',
            partner: '示例合作方',
            signDate: '2024-01-01',
            expireDate: '2025-01-01',
            notes: '这是示例数据，导入前请删除此行',
        };

        // 添加自定义字段示例值
        fields.forEach(field => {
            if (field.type === 'date') {
                exampleRow[`custom_${field.key}`] = '2024-01-01';
            } else if (field.type === 'number') {
                exampleRow[`custom_${field.key}`] = '0';
            } else {
                exampleRow[`custom_${field.key}`] = '示例值';
            }
        });

        worksheet.addRow(exampleRow);

        // Style example row as gray/italic to indicate it should be deleted
        worksheet.getRow(2).font = { italic: true, color: { argb: 'FF888888' } };

        // Add instruction sheet
        const instructionSheet = workbook.addWorksheet('导入说明');
        instructionSheet.columns = [{ header: '导入说明', width: 80 }];
        instructionSheet.addRow(['1. 带 * 号的列为必填项']);
        instructionSheet.addRow(['2. 日期格式请使用 YYYY-MM-DD，例如：2024-01-01']);
        instructionSheet.addRow(['3. 第一行为表头，请勿修改或删除']);
        instructionSheet.addRow(['4. 示例数据行（第2行）请在填写数据前删除']);
        instructionSheet.addRow(['5. 请将数据填入"合同导入模板"工作表中']);
        if (fields.length > 0) {
            instructionSheet.addRow([`6. 自定义字段：${fields.map(f => f.label).join('、')}`]);
        }
        instructionSheet.getRow(1).font = { bold: true, size: 14 };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=contract_import_template.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    }

    @Post('import')
    @UseInterceptors(FileInterceptor('file'))
    async importFromExcel(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
        // 获取自定义字段配置
        const fields = await this.contractsService.getFields();

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer as any);
        const worksheet = workbook.getWorksheet(1);

        if (!worksheet) {
            return { imported: 0, error: 'Invalid Excel file' };
        }

        // 解析表头，建立列索引映射
        const headerRow = worksheet.getRow(1);
        const columnMap: Record<string, number> = {};
        headerRow.eachCell((cell, colNumber) => {
            const header = String(cell.value || '').replace(/\s*\*.*$/, '').replace(/\s*\(.*\)$/, '').trim();
            columnMap[header] = colNumber;
        });

        // 建立自定义字段的列索引映射
        const customFieldMap: Record<string, number> = {};
        fields.forEach(field => {
            if (columnMap[field.label]) {
                customFieldMap[field.key] = columnMap[field.label];
            }
        });

        const contracts: CreateContractDto[] = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const rowValues = row.values as any[];
            const name = columnMap['合同名称'] ? rowValues[columnMap['合同名称']] : null;
            const partner = columnMap['合作方'] ? rowValues[columnMap['合作方']] : null;
            const signDate = columnMap['签订日期'] ? rowValues[columnMap['签订日期']] : null;
            const expireDate = columnMap['到期日期'] ? rowValues[columnMap['到期日期']] : null;

            if (name && partner && signDate && expireDate) {
                // 解析自定义字段数据
                const customData: Record<string, any> = {};
                fields.forEach(field => {
                    const colIndex = customFieldMap[field.key];
                    if (colIndex && rowValues[colIndex] !== undefined && rowValues[colIndex] !== null && rowValues[colIndex] !== '') {
                        let value = rowValues[colIndex];
                        // 根据字段类型处理值
                        if (field.type === 'date' && value) {
                            value = new Date(value).toISOString().split('T')[0];
                        } else if (field.type === 'number' && value) {
                            value = Number(value);
                        } else {
                            value = String(value);
                        }
                        customData[field.key] = value;
                    }
                });

                contracts.push({
                    name: String(name),
                    partner: String(partner),
                    signDate: new Date(signDate).toISOString(),
                    expireDate: new Date(expireDate).toISOString(),
                    customData: Object.keys(customData).length > 0 ? customData : undefined,
                });
            }
        });

        for (const dto of contracts) {
            await this.contractsService.create(dto, req.user.id);
        }

        return { imported: contracts.length };
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.contractsService.findOne(+id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdateContractDto, @Request() req: any) {
        return this.contractsService.update(+id, dto, req.user.id);
    }

    @Put(':id/process')
    markProcessed(@Param('id') id: string, @Request() req: any) {
        return this.contractsService.markProcessed(+id, req.user.id);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @Request() req: any) {
        return this.contractsService.delete(+id, req.user.id);
    }
}
