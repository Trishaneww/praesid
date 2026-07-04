import Anthropic from '@anthropic-ai/sdk';
import { OiicsStructure } from '@praesid/shared';
import { CLASSIFIER_MODEL_ID } from '../../constants/anthropic';
import {
  DECOMPOSE_SCHEMA,
  DECOMPOSE_SYSTEM_PROMPT,
} from '../../constants/classification';
import { parseStructuredResponse } from './parseStructuredResponse';

export const decomposeIncidentNarrative = async (
  anthropic: Anthropic,
  narrative: string,
): Promise<Record<OiicsStructure, string | null>> => {
  const message = await anthropic.messages.create({
    model: CLASSIFIER_MODEL_ID,
    max_tokens: 1024,
    system: DECOMPOSE_SYSTEM_PROMPT,
    output_config: {
      format: { type: 'json_schema', schema: DECOMPOSE_SCHEMA },
    },
    messages: [{ role: 'user', content: narrative }],
  });
  return parseStructuredResponse(message);
};
