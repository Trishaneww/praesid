import { Injectable } from '@nestjs/common';
import { IncidentCodeStatus, OiicsStructure } from '@praesid/shared';
import { Incident, IncidentCode, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../lib/clients/prisma.service';
import { EMBEDDING_MODEL_ID } from '../constants/embeddings';

export interface CreateIncidentData {
  tenantId: string;
  narrative: string;
  occurredAt?: Date | null;
  reportedBy?: string | null;
  externalRef?: string | null;
  bulkUploadId?: string | null;
}

export type IncidentCodeFields = Omit<
  Prisma.IncidentCodeUncheckedCreateInput,
  'incidentId' | 'structure'
>;

export interface SimilarIncidentRow {
  id: string;
  narrative: string;
  occurredAt: Date | null;
  createdAt: Date;
  similarity: number;
}

type IncidentWithCodes = Incident & { codes: IncidentCode[] };
type IncidentWithCodeStatuses = Incident & {
  codes: { status: IncidentCodeStatus }[];
};

@Injectable()
export class IncidentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithEmbedding(
    data: CreateIncidentData,
    vector: number[],
  ): Promise<Incident> {
    const vectorLiteral = `[${vector.join(',')}]`;
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.incident.create({ data });
      await tx.$executeRaw`
        UPDATE "Incident"
        SET embedding = ${vectorLiteral}::vector,
            "embeddedText" = ${data.narrative},
            "embeddingModel" = ${EMBEDDING_MODEL_ID}
        WHERE id = ${created.id}
      `;
      return created;
    });
  }

  findByTenant(tenantId: string): Promise<IncidentWithCodeStatuses[]> {
    return this.prisma.incident.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { codes: { select: { status: true } } },
    });
  }

  findByIdWithCodes(id: string): Promise<IncidentWithCodes | null> {
    return this.prisma.incident.findUnique({
      where: { id },
      include: { codes: { orderBy: { structure: 'asc' } } },
    });
  }

  findById(id: string): Promise<Incident | null> {
    return this.prisma.incident.findUnique({ where: { id } });
  }

  upsertCode(
    incidentId: string,
    structure: OiicsStructure,
    fields: IncidentCodeFields,
  ): Promise<IncidentCode> {
    return this.prisma.incidentCode.upsert({
      where: { incidentId_structure: { incidentId, structure } },
      create: { incidentId, structure, ...fields },
      update: fields,
    });
  }

  updateCodeStatus(
    incidentId: string,
    structure: OiicsStructure,
    status: IncidentCodeStatus,
  ): Promise<IncidentCode> {
    return this.prisma.incidentCode.update({
      where: { incidentId_structure: { incidentId, structure } },
      data: { status },
    });
  }

  findSimilar(id: string, limit: number): Promise<SimilarIncidentRow[]> {
    return this.prisma.$queryRaw<SimilarIncidentRow[]>`
      SELECT i.id, i.narrative, i."occurredAt", i."createdAt",
             1 - (i.embedding <=> source.embedding) AS similarity
      FROM "Incident" i, (SELECT "tenantId", embedding FROM "Incident" WHERE id = ${id}) source
      WHERE i."tenantId" = source."tenantId"
        AND i.id <> ${id}
        AND i.embedding IS NOT NULL
        AND source.embedding IS NOT NULL
      ORDER BY i.embedding <=> source.embedding
      LIMIT ${limit}
    `;
  }
}
