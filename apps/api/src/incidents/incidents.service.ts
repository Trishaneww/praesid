import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IncidentCodeStatus,
  IncidentDetail,
  IncidentSummary,
  OiicsStructure,
  SimilarIncident,
} from '@praesid/shared';
import { PrismaService } from '../lib/clients/prisma.service';
import { OiicsService } from '../oiics/oiics.service';
import { EMBEDDING_CLIENT } from '../lib/clients/embedding-client';
import type { EmbeddingClient } from '../lib/clients/embedding-client';
import { EMBEDDING_MODEL_ID } from '../constants/embeddings';
import { SIMILAR_INCIDENTS_LIMIT } from '../constants/incidents';
import {
  formatIncidentDetail,
  formatIncidentSummary,
} from '../lib/incidents/mapIncident';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { ClassificationService } from './classification.service';

interface SimilarIncidentRow {
  id: string;
  narrative: string;
  occurredAt: Date | null;
  createdAt: Date;
  similarity: number;
}

@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly oiics: OiicsService,
    @Inject(EMBEDDING_CLIENT) private readonly embeddingClient: EmbeddingClient,
    private readonly classification: ClassificationService,
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

    if (dto.autoClassify) {
      return this.classification.classifyIncident(incident.id);
    }
    return formatIncidentDetail({ ...incident, codes: [] }, {});
  }

  async listIncidents(tenantId: string): Promise<IncidentSummary[]> {
    const incidents = await this.prisma.incident.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { codes: { select: { status: true } } },
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
    const titleByKey = await this.oiics.getCodeTitles(incident.codes);
    return formatIncidentDetail(incident, titleByKey);
  }

  async updateCodeStatus(
    incidentId: string,
    structure: OiicsStructure,
    status: IncidentCodeStatus,
  ): Promise<IncidentDetail> {
    try {
      await this.prisma.incidentCode.update({
        where: { incidentId_structure: { incidentId, structure } },
        data: { status },
      });
    } catch {
      throw new NotFoundException(
        `No ${structure} code found for incident ${incidentId}`,
      );
    }
    return this.getIncident(incidentId);
  }

  async findSimilarIncidents(id: string): Promise<SimilarIncident[]> {
    const rows = await this.prisma.$queryRaw<SimilarIncidentRow[]>`
      SELECT i.id, i.narrative, i."occurredAt", i."createdAt",
             1 - (i.embedding <=> source.embedding) AS similarity
      FROM "Incident" i, (SELECT "tenantId", embedding FROM "Incident" WHERE id = ${id}) source
      WHERE i."tenantId" = source."tenantId"
        AND i.id <> ${id}
        AND i.embedding IS NOT NULL
        AND source.embedding IS NOT NULL
      ORDER BY i.embedding <=> source.embedding
      LIMIT ${SIMILAR_INCIDENTS_LIMIT}
    `;
    return rows.map((row) => ({
      id: row.id,
      narrative: row.narrative,
      occurredAt: row.occurredAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      similarity: row.similarity,
    }));
  }
}
