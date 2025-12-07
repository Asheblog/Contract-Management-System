import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
    constructor(private settingsService: SettingsService) { }

    @Get()
    getAllSettings() {
        return this.settingsService.getAllSettings();
    }

    @Get('smtp')
    getSmtpSettings() {
        return this.settingsService.getSmtpSettings();
    }

    @Put('smtp')
    setSmtpSettings(@Body() settings: any) {
        return this.settingsService.setSmtpSettings(settings);
    }

    @Get('reminder')
    getReminderSettings() {
        return this.settingsService.getReminderSettings();
    }

    @Put('reminder')
    setReminderSettings(@Body() settings: any) {
        return this.settingsService.setReminderSettings(settings);
    }
}
