import { Module, OnModuleInit } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { ContractFieldsController } from './contract-fields.controller';

@Module({
    controllers: [ContractsController, ContractFieldsController],
    providers: [ContractsService],
    exports: [ContractsService],
})
export class ContractsModule implements OnModuleInit {
    constructor(private contractsService: ContractsService) {}

    async onModuleInit() {
        // 系统启动时自动初始化系统默认字段
        await this.contractsService.initSystemFields();
    }
}
