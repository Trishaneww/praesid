import { OiicsStructure } from './oiics';

export interface CreateIncidentRequest {
  tenantId: string;
  narrative: string;
  occurredAt?: string;
  reportedBy?: string;
  externalRef?: string;
  autoClassify?: boolean;
}

export type IncidentCodeStatus = 'AUTO' | 'NEEDS_REVIEW' | 'HUMAN_CONFIRMED';

export interface UpdateIncidentCodeStatusRequest {
  status: 'HUMAN_CONFIRMED' | 'NEEDS_REVIEW';
}

export interface IncidentCodeSummary {
  structure: OiicsStructure;
  code: string;
  title: string | null;
  codeVersion: string;
  confidence: number;
  retrievalSimilarity: number | null;
  rationale: string;
  status: IncidentCodeStatus;
}

export interface IncidentSummary {
  id: string;
  tenantId: string;
  narrative: string;
  occurredAt: string | null;
  reportedBy: string | null;
  externalRef: string | null;
  createdAt: string;
  codeCount: number;
  needsReviewCount: number;
}

export interface IncidentDetail extends IncidentSummary {
  codes: IncidentCodeSummary[];
}

export interface SimilarIncident {
  id: string;
  narrative: string;
  occurredAt: string | null;
  createdAt: string;
  similarity: number;
}
