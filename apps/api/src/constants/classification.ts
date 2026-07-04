import { OIICS_STRUCTURES } from '@praesid/shared';
import { OIICS_STRUCTURE_LABELS } from './oiics';

export const PIPELINE_PROMPT_VERSION = 'v1';

export const OIICS_CLASSIFICATION_CANDIDATE_LIMIT = 10;
export const OIICS_CLASSIFICATION_CANDIDATE_CAP = 30;

export const AUTO_CONFIDENCE_THRESHOLD = 0.7; // model self-reported (0..1)
export const AUTO_SIMILARITY_THRESHOLD = 0.45; // chosen candidate cosine similarity

const nullableString = { type: ['string', 'null'] };

export const DECOMPOSE_SYSTEM_PROMPT = `You extract search phrases from a workplace incident narrative to drive OIICS code retrieval.

For each OIICS structure, write a short phrase (a few words) capturing only the part of the incident relevant to that structure, or null if the narrative says nothing about it:
- Nature of injury: the injury or illness itself (e.g. "fractured wrist").
- Part of body: the body part injured (e.g. "wrist").
- Event or exposure: the event that produced the injury (e.g. "fall from scaffold").
- Source of injury: the object, substance, or equipment that inflicted it (e.g. "scaffold").
- Worker activity: what the worker was doing (e.g. "installing drywall").
- Location: where it happened (e.g. "construction site").

Do not invent detail the narrative does not contain. Prefer null over a guess.`;

export const DECOMPOSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: Object.fromEntries(
    OIICS_STRUCTURES.map((structure) => [
      structure,
      {
        ...nullableString,
        description: `Retrieval phrase for ${OIICS_STRUCTURE_LABELS[structure]}, or null if the narrative has no signal for it.`,
      },
    ]),
  ),
  required: [...OIICS_STRUCTURES],
};

export const CLASSIFY_SYSTEM_PREAMBLE = `You are an OIICS coding specialist assigning ONE structure's code to a workplace incident.

You are given the incident narrative, a list of candidate codes (with definitions, includes, excludes, and coding interactions), and the official BLS coding rules for this structure. Choose the single best-fitting code FROM THE CANDIDATE LIST, or null if none genuinely fit.

Rules:
- Choose only a code that appears in the candidate list. Never output a code that is not listed.
- Apply the official coding rules and the code definitions/includes/excludes — do not rely on the code title alone.
- confidence is your calibrated probability (0.0-1.0) that the chosen code is correct. Be honest: use lower values when the narrative is ambiguous or the candidates are all weak.
- rationale: one or two sentences citing the rule or definition that justifies the choice.
- alternativesConsidered: other candidate codes you weighed and why you rejected them (empty array if none).`;

export const CLASSIFY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    code: {
      type: ['string', 'null'],
      description:
        'The chosen OIICS code, copied exactly from the candidate list, or null if none fit.',
    },
    confidence: {
      type: 'number',
      description: 'Calibrated confidence from 0.0 to 1.0 in the chosen code.',
    },
    rationale: {
      type: 'string',
      description:
        'One or two sentences citing the rule or definition behind the choice.',
    },
    alternativesConsidered: {
      type: 'array',
      description: 'Other candidate codes weighed and rejected.',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          code: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['code', 'reason'],
      },
    },
  },
  required: ['code', 'confidence', 'rationale', 'alternativesConsidered'],
};
