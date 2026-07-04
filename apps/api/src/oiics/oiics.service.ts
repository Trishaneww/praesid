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
}
