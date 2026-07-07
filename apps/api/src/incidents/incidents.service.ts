import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IncidentCodeStatus,
  IncidentDetail,
  IncidentSummary,
  OiicsStructure,
  SimilarIncident,
} from '@praesid/shared';
import { OiicsRepository } from '../oiics/oiics.repository';
import { EMBEDDING_CLIENT } from '../lib/clients/embedding-client';
import type { EmbeddingClient } from '../lib/clients/embedding-client';
import { SIMILAR_INCIDENTS_LIMIT } from '../constants/incidents';
import {
  formatIncidentDetail,
  formatIncidentSummary,
} from '../lib/incidents/mapIncident';
import { IncidentsRepository } from './incidents.repository';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { ClassificationService } from './classification.service';

@Injectable()
export class IncidentsService {
  constructor(
    private readonly incidentsRepository: IncidentsRepository,
    private readonly oiicsRepository: OiicsRepository,
    @Inject(EMBEDDING_CLIENT) private readonly embeddingClient: EmbeddingClient,
    private readonly classification: ClassificationService,
  ) {}

  async createIncident(dto: CreateIncidentDto): Promise<IncidentDetail> {
    const [narrativeVector] = await this.embeddingClient.embedText(
      [dto.narrative],
      'document',
    );
    const incident = await this.incidentsRepository.createWithEmbedding(
      {
        tenantId: dto.tenantId,
        narrative: dto.narrative,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : null,
        reportedBy: dto.reportedBy ?? null,
        externalRef: dto.externalRef ?? null,
      },
      narrativeVector,
    );

    if (dto.autoClassify) {
      return this.classification.classifyIncident(incident.id);
    }
    return formatIncidentDetail({ ...incident, codes: [] }, {});
  }

  async listIncidents(tenantId: string): Promise<IncidentSummary[]> {
    const incidents = await this.incidentsRepository.findByTenant(tenantId);
    return incidents.map(formatIncidentSummary);
  }

  async getIncident(id: string): Promise<IncidentDetail> {
    const incident = await this.incidentsRepository.findByIdWithCodes(id);
    if (!incident) {
      throw new NotFoundException(`Incident ${id} not found`);
    }
    const titleByKey = await this.oiicsRepository.getCodeTitles(incident.codes);
    return formatIncidentDetail(incident, titleByKey);
  }

  async updateCodeStatus(
    incidentId: string,
    structure: OiicsStructure,
    status: IncidentCodeStatus,
  ): Promise<IncidentDetail> {
    try {
      await this.incidentsRepository.updateCodeStatus(
        incidentId,
        structure,
        status,
      );
    } catch {
      throw new NotFoundException(
        `No ${structure} code found for incident ${incidentId}`,
      );
    }
    return this.getIncident(incidentId);
  }

  async findSimilarIncidents(id: string): Promise<SimilarIncident[]> {
    const rows = await this.incidentsRepository.findSimilar(
      id,
      SIMILAR_INCIDENTS_LIMIT,
    );
    return rows.map((row) => ({
      id: row.id,
      narrative: row.narrative,
      occurredAt: row.occurredAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      similarity: row.similarity,
    }));
  }
}
