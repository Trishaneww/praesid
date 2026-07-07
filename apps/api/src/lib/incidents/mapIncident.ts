import {
  IncidentCodeStatus,
  IncidentCodeSummary,
  IncidentDetail,
  IncidentSummary,
} from '@praesid/shared';
import { Incident, IncidentCode } from '../../generated/prisma/client';

type IncidentWithCodeStatuses = Incident & {
  codes: { status: IncidentCodeStatus }[];
};

export const formatIncidentSummary = (
  incident: IncidentWithCodeStatuses,
): IncidentSummary => ({
  id: incident.id,
  tenantId: incident.tenantId,
  narrative: incident.narrative,
  occurredAt: incident.occurredAt?.toISOString() ?? null,
  reportedBy: incident.reportedBy,
  externalRef: incident.externalRef,
  createdAt: incident.createdAt.toISOString(),
  codeCount: incident.codes.length,
  needsReviewCount: incident.codes.filter(
    (code) => code.status === 'NEEDS_REVIEW',
  ).length,
});

export const formatIncidentCodeSummary = (
  code: IncidentCode,
  title: string | null,
): IncidentCodeSummary => ({
  structure: code.structure,
  code: code.code,
  title,
  codeVersion: code.codeVersion,
  confidence: code.confidence,
  retrievalSimilarity: code.retrievalSimilarity,
  rationale: code.rationale,
  status: code.status,
});

export const formatIncidentDetail = (
  incident: Incident & { codes: IncidentCode[] },
  titleByKey: Record<string, string>,
): IncidentDetail => ({
  ...formatIncidentSummary(incident),
  codes: incident.codes.map((code) =>
    formatIncidentCodeSummary(
      code,
      titleByKey[`${code.structure}|${code.code}`] ?? null,
    ),
  ),
});
