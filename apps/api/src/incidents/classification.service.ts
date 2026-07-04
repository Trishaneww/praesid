import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IncidentDetail, OIICS_STRUCTURES } from '@praesid/shared';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../lib/clients/prisma.service';
import { AnthropicService } from '../lib/clients/anthropic.service';
import { EMBEDDING_CLIENT } from '../lib/clients/embedding-client';
import type { EmbeddingClient } from '../lib/clients/embedding-client';
import { OiicsService } from '../oiics/oiics.service';
import { CURRENT_OIICS_VERSION } from '../constants/oiics';
import { PIPELINE_PROMPT_VERSION } from '../constants/classification';
import { decomposeIncidentNarrative } from '../lib/incidents/decomposeIncidentNarrative';
import { classifyStructureCode } from '../lib/incidents/classifyStructureCode';
import { gateClassificationStatus } from '../lib/incidents/gateClassificationStatus';
import { loadOiicsRules } from '../lib/incidents/loadOiicsRules';
import { formatIncidentDetail } from '../lib/incidents/mapIncident';

@Injectable()
export class ClassificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly anthropic: AnthropicService,
    private readonly oiics: OiicsService,
    @Inject(EMBEDDING_CLIENT) private readonly embeddingClient: EmbeddingClient,
  ) {}

  async classifyIncident(incidentId: string): Promise<IncidentDetail> {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
    });
    if (!incident) {
      throw new NotFoundException(`Incident ${incidentId} not found`);
    }

    const phrases = await decomposeIncidentNarrative(
      this.anthropic.client,
      incident.narrative,
    );
    const activeStructures = OIICS_STRUCTURES.filter(
      (structure) => phrases[structure],
    );

    if (activeStructures.length > 0) {
      const queryVectors = await this.embeddingClient.embedText(
        activeStructures.map((structure) => phrases[structure] as string),
        'query',
      );
      const rules = loadOiicsRules();

      for (const [index, structure] of activeStructures.entries()) {
        const candidates = await this.oiics.retrieveClassificationCandidates(
          structure,
          queryVectors[index],
        );
        if (candidates.length === 0) continue;

        const { classification, modelId } = await classifyStructureCode(
          this.anthropic.client,
          {
            structure,
            narrative: incident.narrative,
            candidates,
            rulesText: rules[structure],
          },
        );
        if (classification.code === null) continue;

        const retrievalSimilarity =
          candidates.find((candidate) => candidate.code === classification.code)
            ?.similarity ?? null;
        const status = gateClassificationStatus({
          modelConfidence: classification.confidence,
          retrievalSimilarity,
        });

        const fields = {
          code: classification.code,
          codeVersion: CURRENT_OIICS_VERSION,
          confidence: classification.confidence,
          retrievalSimilarity,
          rationale: classification.rationale,
          alternativesConsidered:
            classification.alternativesConsidered as unknown as Prisma.InputJsonValue,
          modelId,
          promptVersion: PIPELINE_PROMPT_VERSION,
          status,
        };
        await this.prisma.incidentCode.upsert({
          where: { incidentId_structure: { incidentId, structure } },
          create: { incidentId, structure, ...fields },
          update: fields,
        });
      }
    }

    const classified = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: { codes: { orderBy: { structure: 'asc' } } },
    });
    return formatIncidentDetail(classified!);
  }
}
