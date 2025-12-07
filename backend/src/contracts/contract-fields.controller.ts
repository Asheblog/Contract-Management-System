import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
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

    @Post()
    createField(@Body() body: { key: string; label: string; type: string }) {
        return this.contractsService.createField(body);
    }

    @Put(':id')
    updateField(@Param('id') id: string, @Body() body: { label?: string; type?: string; isVisible?: boolean }) {
        return this.contractsService.updateField(+id, body);
    }

    @Delete(':id')
    deleteField(@Param('id') id: string) {
        return this.contractsService.deleteField(+id);
    }
}
