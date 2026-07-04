import Anthropic from '@anthropic-ai/sdk';
import { OiicsStructure } from '@praesid/shared';
import { EVAL_JUDGE_MODEL_ID } from '../../constants/anthropic';
import { OIICS_STRUCTURE_LABELS } from '../../constants/oiics';
import { parseStructuredResponse } from '../../lib/incidents/parseStructuredResponse';

const JUDGE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    match: { type: 'boolean' },
    reason: { type: 'string' },
  },
  required: ['match', 'reason'],
};

export const judgeConceptMatch = async (
  anthropic: Anthropic,
  params: {
    structure: OiicsStructure;
    predictedTitle: string;
    goldTitle: string;
  },
): Promise<{ match: boolean; reason: string }> => {
  const label = OIICS_STRUCTURE_LABELS[params.structure];
  const message = await anthropic.messages.create({
    model: EVAL_JUDGE_MODEL_ID,
    max_tokens: 256,
    thinking: { type: 'disabled' },
    system: `You audit an automated OIICS safety coder. For one incident, compare the coder's predicted "${label}" code against the human-assigned gold "${label}" code. They come from different OIICS versions (gold is 2.01, predicted is 3.02), so code numbers and exact wording will differ — judge the underlying CONCEPT, not the text.

Set match=true when the two denote the same "${label}" category for coding purposes, including when:
- the wording differs but the meaning is the same (e.g. "Second degree heat burns" vs "Thermal burns— second degree");
- one is a reasonable more- or less-specific coding of the same thing (e.g. "Amputations" vs "Amputations involving bone loss"; "Sandblasters-powered" vs "Sandblasting machinery");
- the versions renumbered or restructured the same concept.

Set match=false only when they denote genuinely different categories (e.g. a fall vs being struck by an object; wrist vs ankle; a saw vs a ladder). If the predicted code is a defensible coding of the incident even though it differs from the gold, lean toward match=true.`,
    output_config: { format: { type: 'json_schema', schema: JUDGE_SCHEMA } },
    messages: [
      {
        role: 'user',
        content: `Predicted (OIICS 3.02): "${params.predictedTitle}"\nGold (OSHA, OIICS 2.01): "${params.goldTitle}"`,
      },
    ],
  });
  return parseStructuredResponse<{ match: boolean; reason: string }>(message);
};
