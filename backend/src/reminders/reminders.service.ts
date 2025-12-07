import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';
import { ContractsService } from '../contracts/contracts.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class RemindersService {
    private readonly logger = new Logger(RemindersService.name);
    private transporter: nodemailer.Transporter | null = null;

    constructor(
        private contractsService: ContractsService,
        private settingsService: SettingsService,
    ) {
        this.initializeTransporter();
    }

    private async initializeTransporter() {
        const smtp = await this.settingsService.getSmtpSettings();
        if (smtp && smtp.host) {
            this.transporter = nodemailer.createTransport({
                host: smtp.host,
                port: smtp.port || 587,
                secure: smtp.port === 465,
                auth: {
                    user: smtp.user,
                    pass: smtp.pass,
                },
            });
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_9AM)
    async checkExpiringContracts() {
        this.logger.log('Checking expiring contracts...');

        const settings = await this.settingsService.getReminderSettings();
        const reminderDays = settings?.reminderDays || [30, 7, 1];
        const emailEnabled = settings?.emailEnabled ?? false;

        for (const days of reminderDays) {
            const contracts = await this.contractsService.getExpiring(days);

            for (const contract of contracts) {
                const daysUntilExpiry = Math.ceil(
                    (new Date(contract.expireDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );

                if (daysUntilExpiry <= days) {
                    this.logger.log(`Contract "${contract.name}" expires in ${daysUntilExpiry} days`);

                    if (emailEnabled && this.transporter && contract.createdBy.email) {
                        await this.sendReminderEmail(contract, daysUntilExpiry);
                    }
                }
            }
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_10AM)
    async checkUnprocessedExpired() {
        this.logger.log('Checking unprocessed expired contracts...');

        const settings = await this.settingsService.getReminderSettings();
        if (!settings?.repeatReminder) return;

        const contracts = await this.contractsService.getUnprocessedExpired();
        const emailEnabled = settings?.emailEnabled ?? false;

        for (const contract of contracts) {
            const daysOverdue = Math.ceil(
                (Date.now() - new Date(contract.expireDate).getTime()) / (1000 * 60 * 60 * 24)
            );

            this.logger.warn(`Contract "${contract.name}" is ${daysOverdue} days overdue and unprocessed`);

            if (emailEnabled && this.transporter && contract.createdBy.email) {
                await this.sendOverdueEmail(contract, daysOverdue);
            }
        }
    }

    private async sendReminderEmail(contract: any, daysUntilExpiry: number) {
        const smtp = await this.settingsService.getSmtpSettings();
        if (!smtp) return;

        try {
            await this.transporter?.sendMail({
                from: smtp.from || smtp.user,
                to: contract.createdBy.email,
                subject: `[合同提醒] ${contract.name} 将在 ${daysUntilExpiry} 天后到期`,
                html: `
          <h2>合同到期提醒</h2>
          <p>您好，${contract.createdBy.name}：</p>
          <p>合同 <strong>${contract.name}</strong> 将在 <strong>${daysUntilExpiry}</strong> 天后到期。</p>
          <ul>
            <li>合同名称：${contract.name}</li>
            <li>合作方：${contract.partner}</li>
            <li>到期日期：${new Date(contract.expireDate).toLocaleDateString('zh-CN')}</li>
          </ul>
          <p>请及时处理。</p>
        `,
            });
            this.logger.log(`Sent reminder email to ${contract.createdBy.email}`);
        } catch (error) {
            this.logger.error(`Failed to send email: ${error.message}`);
        }
    }

    private async sendOverdueEmail(contract: any, daysOverdue: number) {
        const smtp = await this.settingsService.getSmtpSettings();
        if (!smtp) return;

        try {
            await this.transporter?.sendMail({
                from: smtp.from || smtp.user,
                to: contract.createdBy.email,
                subject: `[紧急] ${contract.name} 已过期 ${daysOverdue} 天`,
                html: `
          <h2 style="color: red;">合同已过期</h2>
          <p>您好，${contract.createdBy.name}：</p>
          <p>合同 <strong>${contract.name}</strong> 已过期 <strong>${daysOverdue}</strong> 天，请立即处理！</p>
          <ul>
            <li>合同名称：${contract.name}</li>
            <li>合作方：${contract.partner}</li>
            <li>到期日期：${new Date(contract.expireDate).toLocaleDateString('zh-CN')}</li>
          </ul>
        `,
            });
            this.logger.log(`Sent overdue email to ${contract.createdBy.email}`);
        } catch (error) {
            this.logger.error(`Failed to send email: ${error.message}`);
        }
    }

    async refreshTransporter() {
        await this.initializeTransporter();
    }
}
