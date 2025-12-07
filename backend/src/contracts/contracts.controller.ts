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
        const contracts = ids
            ? await this.contractsService.findByIds(ids.split(',').map(Number))
            : (await this.contractsService.findAll({ page: 1, limit: 1000 })).data;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('合同列表');

        worksheet.columns = [
            { header: '合同名称', key: 'name', width: 30 },
            { header: '合作方', key: 'partner', width: 25 },
            { header: '签订日期', key: 'signDate', width: 15 },
            { header: '到期日期', key: 'expireDate', width: 15 },
            { header: '状态', key: 'status', width: 10 },
            { header: '已处理', key: 'isProcessed', width: 10 },
        ];

        contracts.forEach(contract => {
            worksheet.addRow({
                name: contract.name,
                partner: contract.partner,
                signDate: contract.signDate?.toISOString().split('T')[0],
                expireDate: contract.expireDate?.toISOString().split('T')[0],
                status: contract.status === 'active' ? '进行中' : contract.status === 'archived' ? '已归档' : '已作废',
                isProcessed: contract.isProcessed ? '是' : '否',
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=contracts.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    }

    @Get('import/template')
    async downloadImportTemplate(@Res() res: Response) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('合同导入模板');

        // Define columns with headers and example data
        worksheet.columns = [
            { header: '合同名称 *', key: 'name', width: 30 },
            { header: '合作方 *', key: 'partner', width: 25 },
            { header: '签订日期 * (YYYY-MM-DD)', key: 'signDate', width: 25 },
            { header: '到期日期 * (YYYY-MM-DD)', key: 'expireDate', width: 25 },
            { header: '备注', key: 'notes', width: 40 },
        ];

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };

        // Add example row
        worksheet.addRow({
            name: '示例合同-请删除此行',
            partner: '示例合作方',
            signDate: '2024-01-01',
            expireDate: '2025-01-01',
            notes: '这是示例数据，导入前请删除此行',
        });

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
        instructionSheet.getRow(1).font = { bold: true, size: 14 };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=contract_import_template.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    }

    @Post('import')
    @UseInterceptors(FileInterceptor('file'))
    async importFromExcel(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer as any);
        const worksheet = workbook.getWorksheet(1);

        if (!worksheet) {
            return { imported: 0, error: 'Invalid Excel file' };
        }

        const contracts: CreateContractDto[] = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            const [_, name, partner, signDate, expireDate] = row.values as any[];
            if (name && partner && signDate && expireDate) {
                contracts.push({
                    name: String(name),
                    partner: String(partner),
                    signDate: new Date(signDate).toISOString(),
                    expireDate: new Date(expireDate).toISOString(),
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
