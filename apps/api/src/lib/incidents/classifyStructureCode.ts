import Anthropic from '@anthropic-ai/sdk';
import { OiicsStructure } from '@praesid/shared';
import { CLASSIFIER_MODEL_ID } from '../../constants/anthropic';
import {
  CLASSIFY_SCHEMA,
  CLASSIFY_SYSTEM_PREAMBLE,
} from '../../constants/classification';
import { OIICS_STRUCTURE_LABELS } from '../../constants/oiics';
import { OiicsClassificationCandidate } from '../../oiics/oiics.service';
import { formatCandidatesForPrompt } from './formatCandidatesForPrompt';
import { parseStructuredResponse } from './parseStructuredResponse';
import {
  addUsage,
  EMPTY_USAGE,
  TokenUsage,
  usageFromMessage,
} from './tokenUsage';

export interface StructureClassification {
  code: string | null;
  confidence: number;
  rationale: string;
  alternativesConsidered: { code: string; reason: string }[];
}

const MAX_ATTEMPTS = 2;

export const classifyStructureCode = async (
  anthropic: Anthropic,
  params: {
    structure: OiicsStructure;
    narrative: string;
    candidates: OiicsClassificationCandidate[];
    rulesText: string;
  },
): Promise<{
  classification: StructureClassification;
  modelId: string;
  usage: TokenUsage;
}> => {
  const { structure, narrative, candidates, rulesText } = params;
  const candidateCodes = new Set(candidates.map((candidate) => candidate.code));
  const label = OIICS_STRUCTURE_LABELS[structure];

  const system = [
    { type: 'text' as const, text: CLASSIFY_SYSTEM_PREAMBLE },
    {
      type: 'text' as const,
      text: `Official BLS coding rules for ${label}:\n\n${rulesText}`,
      cache_control: { type: 'ephemeral' as const },
    },
  ];
  const baseUserText = `Incident narrative:\n${narrative}\n\nCandidate ${label} codes:\n${formatCandidatesForPrompt(candidates)}`;

  let last: StructureClassification | null = null;
  let modelId = CLASSIFIER_MODEL_ID;
  let usage = EMPTY_USAGE;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: baseUserText },
    ];
    if (attempt > 0 && last) {
      messages.push(
        { role: 'assistant', content: JSON.stringify(last) },
        {
          role: 'user',
          content: `"${last.code}" is not one of the candidate codes. Choose again using only a code from the candidate list above, or null.`,
        },
      );
    }

    const message = await anthropic.messages.create({
      model: CLASSIFIER_MODEL_ID,
      max_tokens: 1024,
      system,
      output_config: {
        format: { type: 'json_schema', schema: CLASSIFY_SCHEMA },
      },
      messages,
    });
    modelId = message.model;
    usage = addUsage(usage, usageFromMessage(message));
    last = parseStructuredResponse<StructureClassification>(message);

    if (last.code === null || candidateCodes.has(last.code)) {
      return { classification: last, modelId, usage };
    }
  }

  const resolved = last as StructureClassification;
  return {
    classification: {
      code: candidates[0].code,
      confidence: Math.min(resolved.confidence, 0.4),
      rationale: `${resolved.rationale} [fell back to the nearest retrieved candidate; the model's chosen code was not in the candidate list]`,
      alternativesConsidered: resolved.alternativesConsidered,
    },
    modelId,
    usage,
  };
};
