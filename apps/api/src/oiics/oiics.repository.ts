import { Injectable } from '@nestjs/common';
import { OiicsCodeCandidate, OiicsStructure } from '@praesid/shared';
import { PrismaService } from '../lib/clients/prisma.service';
import {
  CURRENT_OIICS_VERSION,
  OIICS_SEARCH_CANDIDATE_LIMIT,
} from '../constants/oiics';
import {
  OIICS_CLASSIFICATION_CANDIDATE_CAP,
  OIICS_CLASSIFICATION_CANDIDATE_LIMIT,
} from '../constants/classification';

export interface OiicsClassificationCandidate {
  code: string;
  title: string;
  definition: string | null;
  includes: string | null;
  excludes: string | null;
  codingInteractions: string | null;
  parentCode: string | null;
  similarity: number;
}

@Injectable()
export class OiicsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getCodeTitles(
    refs: { structure: OiicsStructure; code: string }[],
  ): Promise<Record<string, string>> {
    if (refs.length === 0) return {};
    const rows = await this.prisma.oiicsCode.findMany({
      where: {
        version: CURRENT_OIICS_VERSION,
        OR: refs.map((ref) => ({ structure: ref.structure, code: ref.code })),
      },
      select: { structure: true, code: true, title: true },
    });
    return Object.fromEntries(
      rows.map((row) => [`${row.structure}|${row.code}`, row.title]),
    );
  }

  async getCodeParents(
    refs: { structure: OiicsStructure; code: string }[],
  ): Promise<Record<string, string | null>> {
    if (refs.length === 0) return {};
    const rows = await this.prisma.oiicsCode.findMany({
      where: {
        version: CURRENT_OIICS_VERSION,
        OR: refs.map((ref) => ({ structure: ref.structure, code: ref.code })),
      },
      select: { structure: true, code: true, parentCode: true },
    });
    return Object.fromEntries(
      rows.map((row) => [`${row.structure}|${row.code}`, row.parentCode]),
    );
  }

  retrieveSearchCandidates(
    structure: OiicsStructure,
    queryVector: number[],
  ): Promise<OiicsCodeCandidate[]> {
    const vectorLiteral = `[${queryVector.join(',')}]`;
    return this.prisma.$queryRaw<OiicsCodeCandidate[]>`
      SELECT code, title, 1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
      FROM "OiicsCode"
      WHERE structure = ${structure}::"OiicsStructure"
        AND version = ${CURRENT_OIICS_VERSION}
        AND "isActive" = true
        AND "isSummary" = false
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT ${OIICS_SEARCH_CANDIDATE_LIMIT}
    `;
  }

  retrieveClassificationCandidates(
    structure: OiicsStructure,
    queryVector: number[],
  ): Promise<OiicsClassificationCandidate[]> {
    const vectorLiteral = `[${queryVector.join(',')}]`;
    return this.prisma.$queryRaw<OiicsClassificationCandidate[]>`
      WITH top AS (
        SELECT code, "parentCode"
        FROM "OiicsCode"
        WHERE structure = ${structure}::"OiicsStructure"
          AND version = ${CURRENT_OIICS_VERSION}
          AND "isActive" = true
          AND "isSummary" = false
          AND embedding IS NOT NULL
        ORDER BY embedding <=> ${vectorLiteral}::vector
        LIMIT ${OIICS_CLASSIFICATION_CANDIDATE_LIMIT}
      )
      SELECT c.code, c.title, c.definition, c.includes, c.excludes,
             c."codingInteractions", c."parentCode",
             1 - (c.embedding <=> ${vectorLiteral}::vector) AS similarity
      FROM "OiicsCode" c
      WHERE c.structure = ${structure}::"OiicsStructure"
        AND c.version = ${CURRENT_OIICS_VERSION}
        AND c."isActive" = true
        AND c."isSummary" = false
        AND c.embedding IS NOT NULL
        AND (
          c.code IN (SELECT code FROM top)
          OR c."parentCode" IN (
            SELECT "parentCode" FROM top WHERE "parentCode" IS NOT NULL
          )
        )
      ORDER BY similarity DESC
      LIMIT ${OIICS_CLASSIFICATION_CANDIDATE_CAP}
    `;
  }
}
