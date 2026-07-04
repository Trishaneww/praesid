import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { BulkUploadSummary } from '@praesid/shared';
import { PrismaService } from '../lib/clients/prisma.service';
import { EMBEDDING_CLIENT } from '../lib/clients/embedding-client';
import type { EmbeddingClient } from '../lib/clients/embedding-client';
import { EMBEDDING_MODEL_ID } from '../constants/embeddings';
import { CLASSIFICATION_QUEUE } from '../constants/queue';
import { parseUploadRows } from '../lib/bulk/parseUploadRows';
import { formatBulkUpload } from '../lib/bulk/mapBulkUpload';
import { CreateBulkUploadDto } from './dto/create-bulk-upload.dto';

export interface ClassificationJobData {
  incidentId: string;
  bulkUploadId: string;
}

@Injectable()
export class BulkService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(EMBEDDING_CLIENT) private readonly embeddingClient: EmbeddingClient,
    @InjectQueue(CLASSIFICATION_QUEUE)
    private readonly queue: Queue<ClassificationJobData>,
  ) {}

  async createUpload(dto: CreateBulkUploadDto): Promise<BulkUploadSummary> {
    const buffer = Buffer.from(dto.contentBase64, 'base64');
    const narratives = await parseUploadRows(buffer, dto.filename);
    if (narratives.length === 0) {
      throw new BadRequestException(
        'No narratives found in the file. Expected a column like "narrative" or "description".',
      );
    }

    const upload = await this.prisma.bulkUpload.create({
      data: {
        tenantId: dto.tenantId,
        filename: dto.filename,
        totalRows: narratives.length,
      },
    });

    const vectors = await this.embeddingClient.embedText(
      narratives,
      'document',
    );
    const incidentIds: string[] = [];
    for (let i = 0; i < narratives.length; i++) {
      const incident = await this.prisma.incident.create({
        data: {
          tenantId: dto.tenantId,
          bulkUploadId: upload.id,
          narrative: narratives[i],
        },
      });
      const vectorLiteral = `[${vectors[i].join(',')}]`;
      await this.prisma.$executeRaw`
        UPDATE "Incident"
        SET embedding = ${vectorLiteral}::vector,
            "embeddedText" = ${narratives[i]},
            "embeddingModel" = ${EMBEDDING_MODEL_ID}
        WHERE id = ${incident.id}
      `;
      incidentIds.push(incident.id);
    }

    await this.prisma.bulkUpload.update({
      where: { id: upload.id },
      data: { status: 'PROCESSING' },
    });
    await this.queue.addBulk(
      incidentIds.map((incidentId) => ({
        name: 'classify',
        data: { incidentId, bulkUploadId: upload.id },
      })),
    );

    return formatBulkUpload({ ...upload, status: 'PROCESSING' });
  }

  async getUpload(id: string): Promise<BulkUploadSummary> {
    const upload = await this.prisma.bulkUpload.findUnique({ where: { id } });
    if (!upload) throw new NotFoundException(`Bulk upload ${id} not found`);
    return formatBulkUpload(upload);
  }

  async listUploads(tenantId: string): Promise<BulkUploadSummary[]> {
    const uploads = await this.prisma.bulkUpload.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return uploads.map(formatBulkUpload);
  }
}
