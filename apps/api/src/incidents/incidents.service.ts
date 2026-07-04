import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IncidentDetail, IncidentSummary } from '@praesid/shared';
import { PrismaService } from '../lib/clients/prisma.service';
import { EMBEDDING_CLIENT } from '../lib/clients/embedding-client';
import type { EmbeddingClient } from '../lib/clients/embedding-client';
import { EMBEDDING_MODEL_ID } from '../constants/embeddings';
import {
  formatIncidentDetail,
  formatIncidentSummary,
} from '../lib/incidents/mapIncident';
import { CreateIncidentDto } from './dto/create-incident.dto';

@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(EMBEDDING_CLIENT) private readonly embeddingClient: EmbeddingClient,
  ) {}

  async createIncident(dto: CreateIncidentDto): Promise<IncidentDetail> {
    const [narrativeVector] = await this.embeddingClient.embedText(
      [dto.narrative],
      'document',
    );
    const vectorLiteral = `[${narrativeVector.join(',')}]`;

    const incident = await this.prisma.$transaction(async (tx) => {
      const created = await tx.incident.create({
        data: {
          tenantId: dto.tenantId,
          narrative: dto.narrative,
          occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : null,
          reportedBy: dto.reportedBy ?? null,
          externalRef: dto.externalRef ?? null,
        },
      });
      await tx.$executeRaw`
        UPDATE "Incident"
        SET embedding = ${vectorLiteral}::vector,
            "embeddedText" = ${dto.narrative},
            "embeddingModel" = ${EMBEDDING_MODEL_ID}
        WHERE id = ${created.id}
      `;
      return created;
    });

    return formatIncidentDetail({ ...incident, codes: [] });
  }

  async listIncidents(tenantId: string): Promise<IncidentSummary[]> {
    const incidents = await this.prisma.incident.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return incidents.map(formatIncidentSummary);
  }

  async getIncident(id: string): Promise<IncidentDetail> {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: { codes: { orderBy: { structure: 'asc' } } },
    });
    if (!incident) {
      throw new NotFoundException(`Incident ${id} not found`);
    }
    return formatIncidentDetail(incident);
  }
}
