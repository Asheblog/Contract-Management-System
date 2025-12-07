import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SmtpSettings {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
}

export interface ReminderSettings {
    emailEnabled: boolean;
    reminderDays: number[];
    repeatReminder: boolean;
    repeatIntervalDays: number;
}

@Injectable()
export class SettingsService {
    constructor(private prisma: PrismaService) { }

    async getSetting(key: string) {
        const setting = await this.prisma.systemSetting.findUnique({ where: { key } });
        return setting ? JSON.parse(setting.value) : null;
    }

    async setSetting(key: string, value: any) {
        return this.prisma.systemSetting.upsert({
            where: { key },
            update: { value: JSON.stringify(value) },
            create: { key, value: JSON.stringify(value) },
        });
    }

    async getSmtpSettings(): Promise<SmtpSettings | null> {
        return this.getSetting('smtp');
    }

    async setSmtpSettings(settings: SmtpSettings) {
        return this.setSetting('smtp', settings);
    }

    async getReminderSettings(): Promise<ReminderSettings | null> {
        const settings = await this.getSetting('reminder');
        return settings || {
            emailEnabled: false,
            reminderDays: [30, 7, 1],
            repeatReminder: true,
            repeatIntervalDays: 1,
        };
    }

    async setReminderSettings(settings: ReminderSettings) {
        return this.setSetting('reminder', settings);
    }

    async getAllSettings() {
        const smtp = await this.getSmtpSettings();
        const reminder = await this.getReminderSettings();
        return { smtp, reminder };
    }
}
