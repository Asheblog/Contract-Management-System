import { Controller, Get, Post, Delete, Param, UseGuards, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
    constructor(private attachmentsService: AttachmentsService) { }

    @Post('upload/:contractId')
    @UseInterceptors(FileInterceptor('file', {
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }))
    upload(@Param('contractId') contractId: string, @UploadedFile() file: Express.Multer.File) {
        return this.attachmentsService.upload(+contractId, file);
    }

    @Get('contract/:contractId')
    findByContract(@Param('contractId') contractId: string) {
        return this.attachmentsService.findByContract(+contractId);
    }

    @Get(':id/download')
    async download(@Param('id') id: string, @Res() res: Response) {
        const { stream, fileName, mimeType } = await this.attachmentsService.download(+id);
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
        stream.pipe(res);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.attachmentsService.delete(+id);
    }
}
