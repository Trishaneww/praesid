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

export interface IncidentCodeSummary {
  structure: OiicsStructure;
  code: string;
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
}

export interface IncidentDetail extends IncidentSummary {
  codes: IncidentCodeSummary[];
}
