import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('contract-fields')
@UseGuards(JwtAuthGuard)
export class ContractFieldsController {
    constructor(private contractsService: ContractsService) { }

    @Get()
    getFields() {
        return this.contractsService.getFields();
    }

    @Post('init-system')
    initSystemFields() {
        return this.contractsService.initSystemFields();
    }

    @Post()
    createField(@Body() body: { key: string; label: string; type: string }) {
        return this.contractsService.createField(body);
    }

    @Put(':id')
    updateField(@Param('id') id: string, @Body() body: { label?: string; type?: string; isVisible?: boolean }) {
        return this.contractsService.updateField(+id, body);
    }

    @Delete(':id')
    async deleteField(@Param('id') id: string) {
        try {
            return await this.contractsService.deleteField(+id);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }
}
