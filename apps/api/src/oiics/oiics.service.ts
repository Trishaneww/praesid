import { Inject, Injectable } from '@nestjs/common';
import {
  OIICS_STRUCTURES,
  OiicsCodeCandidate,
  OiicsSearchResponse,
  OiicsStructure,
} from '@praesid/shared';
import { PrismaService } from '../lib/clients/prisma.service';
import { EMBEDDING_CLIENT } from '../lib/clients/embedding-client';
import type { EmbeddingClient } from '../lib/clients/embedding-client';
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
export class OiicsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(EMBEDDING_CLIENT) private readonly embeddingClient: EmbeddingClient,
  ) {}

  async searchCandidateCodes(narrative: string): Promise<OiicsSearchResponse> {
    const [narrativeVector] = await this.embeddingClient.embedText(
      [narrative],
      'query',
    );
    const candidateLists = await Promise.all(
      OIICS_STRUCTURES.map((structure) =>
        this.retrieveCandidateCodes(structure, narrativeVector),
      ),
    );
    const candidatesByStructure = Object.fromEntries(
      OIICS_STRUCTURES.map((structure, index) => [
        structure,
        candidateLists[index],
      ]),
    ) as Record<OiicsStructure, OiicsCodeCandidate[]>;

    return { narrative, candidatesByStructure };
  }

  private async retrieveCandidateCodes(
    structure: OiicsStructure,
    narrativeVector: number[],
  ): Promise<OiicsCodeCandidate[]> {
    const vectorLiteral = `[${narrativeVector.join(',')}]`;
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

  async retrieveClassificationCandidates(
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
