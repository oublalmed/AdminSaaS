import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';
import * as Tesseract from 'tesseract.js';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class DocumentsService {
  private uploadDir = path.join(process.cwd(), 'uploads');

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(
    file: Express.Multer.File,
    userId: string,
    tenantId: string,
  ) {
    const tenantDir = path.join(this.uploadDir, tenantId);
    if (!fs.existsSync(tenantDir)) {
      fs.mkdirSync(tenantDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(tenantDir, fileName);
    fs.writeFileSync(filePath, file.buffer);

    const document = await this.prisma.document.create({
      data: {
        tenantId,
        userId,
        fileName: file.originalname,
        fileUrl: `/uploads/${tenantId}/${fileName}`,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });

    // Process OCR asynchronously
    this.processOcr(document.id, filePath).catch(console.error);

    return document;
  }

  private async processOcr(documentId: string, filePath: string) {
    try {
      const result = await Tesseract.recognize(filePath, 'fra+ara+eng');
      const ocrText = result.data.text;

      let ocrData = null;
      let docType = 'OTHER' as any;

      if (ocrText && ocrText.trim().length > 10) {
        const aiResult = await this.aiService.extractDocumentData(ocrText);
        ocrData = aiResult.data;
        docType = aiResult.type || 'OTHER';
      }

      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          ocrText,
          ocrData: ocrData as any,
          type: docType,
          isProcessed: true,
        },
      });
    } catch (error) {
      console.error('OCR processing failed:', error);
      await this.prisma.document.update({
        where: { id: documentId },
        data: { isProcessed: true },
      });
    }
  }

  async findAll(tenantId: string, type?: string) {
    const where: any = { tenantId };
    if (type) where.type = type;
    return this.prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, tenantId },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async delete(id: string, tenantId: string) {
    const doc = await this.findOne(id, tenantId);
    const filePath = path.join(process.cwd(), doc.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return this.prisma.document.delete({ where: { id } });
  }
}
