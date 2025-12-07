import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { ContractFieldsController } from './contract-fields.controller';

@Module({
    controllers: [ContractsController, ContractFieldsController],
    providers: [ContractsService],
    exports: [ContractsService],
})
export class ContractsModule { }
