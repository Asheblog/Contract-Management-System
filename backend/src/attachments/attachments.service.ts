import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AttachmentsService {
    private uploadDir = process.env.UPLOAD_DIR || './uploads';

    constructor(private prisma: PrismaService) {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async upload(contractId: number, file: Express.Multer.File) {
        const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
        if (!contract) throw new NotFoundException('Contract not found');

        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = path.join(this.uploadDir, fileName);

        fs.writeFileSync(filePath, file.buffer);

        return this.prisma.attachment.create({
            data: {
                fileName: file.originalname,
                filePath: fileName,
                mimeType: file.mimetype,
                size: file.size,
                contractId,
            },
        });
    }

    async findByContract(contractId: number) {
        return this.prisma.attachment.findMany({ where: { contractId } });
    }

    async download(id: number) {
        const attachment = await this.prisma.attachment.findUnique({ where: { id } });
        if (!attachment) throw new NotFoundException('Attachment not found');

        const filePath = path.join(this.uploadDir, attachment.filePath);
        if (!fs.existsSync(filePath)) throw new NotFoundException('File not found');

        return {
            stream: fs.createReadStream(filePath),
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
        };
    }

    async delete(id: number) {
        const attachment = await this.prisma.attachment.findUnique({ where: { id } });
        if (!attachment) throw new NotFoundException('Attachment not found');

        const filePath = path.join(this.uploadDir, attachment.filePath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return this.prisma.attachment.delete({ where: { id } });
    }
}
