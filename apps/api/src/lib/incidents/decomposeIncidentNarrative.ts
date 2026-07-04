import Anthropic from '@anthropic-ai/sdk';
import { OiicsStructure } from '@praesid/shared';
import { CLASSIFIER_MODEL_ID } from '../../constants/anthropic';
import {
  DECOMPOSE_SCHEMA,
  DECOMPOSE_SYSTEM_PROMPT,
} from '../../constants/classification';
import { parseStructuredResponse } from './parseStructuredResponse';
import { TokenUsage, usageFromMessage } from './tokenUsage';

export const decomposeIncidentNarrative = async (
  anthropic: Anthropic,
  narrative: string,
): Promise<{
  phrases: Record<OiicsStructure, string | null>;
  usage: TokenUsage;
}> => {
  const message = await anthropic.messages.create({
    model: CLASSIFIER_MODEL_ID,
    max_tokens: 1024,
    system: DECOMPOSE_SYSTEM_PROMPT,
    output_config: {
      format: { type: 'json_schema', schema: DECOMPOSE_SCHEMA },
    },
    messages: [{ role: 'user', content: narrative }],
  });
  return {
    phrases:
      parseStructuredResponse<Record<OiicsStructure, string | null>>(message),
    usage: usageFromMessage(message),
  };
};
