export const OIICS_STRUCTURES = [
  'NATURE',
  'PART_OF_BODY',
  'EVENT',
  'SOURCE',
  'WORKER_ACTIVITY',
  'LOCATION',
] as const;

export type OiicsStructure = (typeof OIICS_STRUCTURES)[number];

export interface OiicsSearchRequest {
  narrative: string;
}

export interface OiicsCodeCandidate {
  code: string;
  title: string;
  similarity: number;
}

export interface OiicsSearchResponse {
  narrative: string;
  candidatesByStructure: Record<OiicsStructure, OiicsCodeCandidate[]>;
}
