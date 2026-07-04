import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IncidentDetail,
  OIICS_STRUCTURES,
  OiicsStructure,
} from '@praesid/shared';
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
import { addUsage, TokenUsage } from '../lib/incidents/tokenUsage';

export interface StructurePrediction {
  structure: OiicsStructure;
  code: string;
  title: string;
  confidence: number;
  retrievalSimilarity: number | null;
  rationale: string;
  alternativesConsidered: { code: string; reason: string }[];
  modelId: string;
}

export interface NarrativeClassification {
  predictions: StructurePrediction[];
  usage: TokenUsage;
}

@Injectable()
export class ClassificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly anthropic: AnthropicService,
    private readonly oiics: OiicsService,
    @Inject(EMBEDDING_CLIENT) private readonly embeddingClient: EmbeddingClient,
  ) {}

  async classifyNarrative(narrative: string): Promise<NarrativeClassification> {
    const { phrases, usage: decomposeUsage } = await decomposeIncidentNarrative(
      this.anthropic.client,
      narrative,
    );
    let usage = decomposeUsage;

    const activeStructures = OIICS_STRUCTURES.filter(
      (structure) => phrases[structure],
    );
    const predictions: StructurePrediction[] = [];
    if (activeStructures.length === 0) return { predictions, usage };

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

      const {
        classification,
        modelId,
        usage: classifyUsage,
      } = await classifyStructureCode(this.anthropic.client, {
        structure,
        narrative,
        candidates,
        rulesText: rules[structure],
      });
      usage = addUsage(usage, classifyUsage);
      if (classification.code === null) continue;

      const chosen = candidates.find(
        (candidate) => candidate.code === classification.code,
      );
      predictions.push({
        structure,
        code: classification.code,
        title: chosen?.title ?? classification.code,
        confidence: classification.confidence,
        retrievalSimilarity: chosen?.similarity ?? null,
        rationale: classification.rationale,
        alternativesConsidered: classification.alternativesConsidered,
        modelId,
      });
    }

    return { predictions, usage };
  }

  async classifyIncident(incidentId: string): Promise<IncidentDetail> {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
    });
    if (!incident) {
      throw new NotFoundException(`Incident ${incidentId} not found`);
    }

    const { predictions } = await this.classifyNarrative(incident.narrative);

    for (const prediction of predictions) {
      const status = gateClassificationStatus({
        modelConfidence: prediction.confidence,
        retrievalSimilarity: prediction.retrievalSimilarity,
      });
      const fields = {
        code: prediction.code,
        codeVersion: CURRENT_OIICS_VERSION,
        confidence: prediction.confidence,
        retrievalSimilarity: prediction.retrievalSimilarity,
        rationale: prediction.rationale,
        alternativesConsidered:
          prediction.alternativesConsidered as unknown as Prisma.InputJsonValue,
        modelId: prediction.modelId,
        promptVersion: PIPELINE_PROMPT_VERSION,
        status,
      };
      await this.prisma.incidentCode.upsert({
        where: {
          incidentId_structure: { incidentId, structure: prediction.structure },
        },
        create: { incidentId, structure: prediction.structure, ...fields },
        update: fields,
      });
    }

    const classified = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: { codes: { orderBy: { structure: 'asc' } } },
    });
    const titleByKey = await this.oiics.getCodeTitles(classified!.codes);
    return formatIncidentDetail(classified!, titleByKey);
  }
}
