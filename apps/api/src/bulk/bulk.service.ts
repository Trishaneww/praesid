import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { BulkUploadSummary } from '@praesid/shared';
import { EMBEDDING_CLIENT } from '../lib/clients/embedding-client';
import type { EmbeddingClient } from '../lib/clients/embedding-client';
import { IncidentsRepository } from '../incidents/incidents.repository';
import { CLASSIFICATION_QUEUE } from '../constants/queue';
import { parseUploadRows } from '../lib/bulk/parseUploadRows';
import { formatBulkUpload } from '../lib/bulk/mapBulkUpload';
import { BulkUploadsRepository } from './bulk.repository';
import { CreateBulkUploadDto } from './dto/create-bulk-upload.dto';

export interface ClassificationJobData {
  incidentId: string;
  bulkUploadId: string;
}

@Injectable()
export class BulkService {
  constructor(
    private readonly bulkUploadsRepository: BulkUploadsRepository,
    private readonly incidentsRepository: IncidentsRepository,
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

    const upload = await this.bulkUploadsRepository.create({
      tenantId: dto.tenantId,
      filename: dto.filename,
      totalRows: narratives.length,
    });

    const vectors = await this.embeddingClient.embedText(
      narratives,
      'document',
    );
    const incidentIds: string[] = [];
    for (let i = 0; i < narratives.length; i++) {
      const incident = await this.incidentsRepository.createWithEmbedding(
        {
          tenantId: dto.tenantId,
          bulkUploadId: upload.id,
          narrative: narratives[i],
        },
        vectors[i],
      );
      incidentIds.push(incident.id);
    }

    await this.bulkUploadsRepository.markProcessing(upload.id);
    await this.queue.addBulk(
      incidentIds.map((incidentId) => ({
        name: 'classify',
        data: { incidentId, bulkUploadId: upload.id },
      })),
    );

    return formatBulkUpload({ ...upload, status: 'PROCESSING' });
  }

  async getUpload(id: string): Promise<BulkUploadSummary> {
    const upload = await this.bulkUploadsRepository.findById(id);
    if (!upload) throw new NotFoundException(`Bulk upload ${id} not found`);
    return formatBulkUpload(upload);
  }

  async listUploads(tenantId: string): Promise<BulkUploadSummary[]> {
    const uploads = await this.bulkUploadsRepository.findByTenant(tenantId);
    return uploads.map(formatBulkUpload);
  }
}
