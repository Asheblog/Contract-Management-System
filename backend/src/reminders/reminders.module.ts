import { Module } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { ContractsModule } from '../contracts/contracts.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
    imports: [ContractsModule, SettingsModule],
    providers: [RemindersService],
    exports: [RemindersService],
})
export class RemindersModule { }
