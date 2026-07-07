import { Inject, Injectable } from '@nestjs/common';
import {
  OIICS_STRUCTURES,
  OiicsCodeCandidate,
  OiicsSearchResponse,
  OiicsStructure,
} from '@praesid/shared';
import { EMBEDDING_CLIENT } from '../lib/clients/embedding-client';
import type { EmbeddingClient } from '../lib/clients/embedding-client';
import { OiicsRepository } from './oiics.repository';

@Injectable()
export class OiicsService {
  constructor(
    @Inject(EMBEDDING_CLIENT) private readonly embeddingClient: EmbeddingClient,
    private readonly oiicsRepository: OiicsRepository,
  ) {}

  async searchCandidateCodes(narrative: string): Promise<OiicsSearchResponse> {
    const [narrativeVector] = await this.embeddingClient.embedText(
      [narrative],
      'query',
    );
    const candidateLists = await Promise.all(
      OIICS_STRUCTURES.map((structure) =>
        this.oiicsRepository.retrieveSearchCandidates(
          structure,
          narrativeVector,
        ),
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
}
