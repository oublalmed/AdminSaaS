import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import * as Tesseract from 'tesseract.js';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
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
    // Sanitize filename: remove path traversal, keep only safe characters
    const safeOriginal = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const fileName = `${Date.now()}-${uniqueId}-${safeOriginal}`;

    const tenantDir = path.join(this.uploadDir, tenantId);
    if (!fs.existsSync(tenantDir)) {
      fs.mkdirSync(tenantDir, { recursive: true });
    }

    // Verify resolved path stays within upload directory
    const filePath = path.resolve(tenantDir, fileName);
    if (!filePath.startsWith(path.resolve(this.uploadDir))) {
      throw new BadRequestException('Invalid file path');
    }

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
    this.processOcr(document.id, filePath).catch((err) =>
      this.logger.error(`OCR failed for document ${document.id}: ${err.message}`),
    );

    return document;
  }

  private async processOcr(documentId: string, filePath: string) {
    try {
      const result = await Tesseract.recognize(filePath, 'fra+ara+eng');
      const ocrText = result.data.text;

      let ocrData = null;
      let docType = 'OTHER' as any;

      if (ocrText && ocrText.trim().length > 10) {
        try {
          const aiResult = await this.aiService.extractDocumentData(ocrText);
          ocrData = aiResult.data;
          docType = aiResult.type || 'OTHER';
        } catch (aiErr) {
          this.logger.warn(`AI extraction failed for ${documentId}: ${aiErr.message}`);
        }
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
      this.logger.error(`OCR processing failed for ${documentId}:`, error);
      // Mark as processed with error note so frontend knows it failed
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          isProcessed: true,
          ocrText: '[OCR_ERROR] Le traitement OCR a echoue. Veuillez reessayer.',
        },
      });
    }
  }

  async findAll(tenantId: string, pagination: PaginationDto, type?: string): Promise<PaginatedResult<any>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
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
    const filePath = path.resolve(process.cwd(), doc.fileUrl.replace(/^\//, ''));
    // Verify path is within uploads
    if (filePath.startsWith(path.resolve(this.uploadDir)) && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return this.prisma.document.delete({ where: { id } });
  }
}
