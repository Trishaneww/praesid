import {
  IncidentCodeSummary,
  IncidentDetail,
  IncidentSummary,
} from '@praesid/shared';
import { Incident, IncidentCode } from '../../generated/prisma/client';

export const formatIncidentSummary = (incident: Incident): IncidentSummary => ({
  id: incident.id,
  tenantId: incident.tenantId,
  narrative: incident.narrative,
  occurredAt: incident.occurredAt?.toISOString() ?? null,
  reportedBy: incident.reportedBy,
  externalRef: incident.externalRef,
  createdAt: incident.createdAt.toISOString(),
});

export const formatIncidentCodeSummary = (
  code: IncidentCode,
): IncidentCodeSummary => ({
  structure: code.structure,
  code: code.code,
  codeVersion: code.codeVersion,
  confidence: code.confidence,
  retrievalSimilarity: code.retrievalSimilarity,
  rationale: code.rationale,
  status: code.status,
});

export const formatIncidentDetail = (
  incident: Incident & { codes: IncidentCode[] },
): IncidentDetail => ({
  ...formatIncidentSummary(incident),
  codes: incident.codes.map(formatIncidentCodeSummary),
});
