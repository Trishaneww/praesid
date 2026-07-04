import {
  CreateIncidentRequest,
  IncidentCodeStatus,
  IncidentDetail,
  IncidentSummary,
  OiicsStructure,
  SimilarIncident,
} from '@praesid/shared';
import { API_BASE_URL } from '@/constants/api';

const readJson = async (response: Response) => {
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json();
};

export const createIncident = (
  request: CreateIncidentRequest,
): Promise<IncidentDetail> =>
  fetch(`${API_BASE_URL}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  }).then(readJson);

export const listIncidents = (tenantId: string): Promise<IncidentSummary[]> =>
  fetch(
    `${API_BASE_URL}/incidents?tenantId=${encodeURIComponent(tenantId)}`,
  ).then(readJson);

export const getIncident = (id: string): Promise<IncidentDetail> =>
  fetch(`${API_BASE_URL}/incidents/${id}`).then(readJson);

export const classifyIncident = (id: string): Promise<IncidentDetail> =>
  fetch(`${API_BASE_URL}/incidents/${id}/classify`, { method: 'POST' }).then(
    readJson,
  );

export const fetchSimilarIncidents = (id: string): Promise<SimilarIncident[]> =>
  fetch(`${API_BASE_URL}/incidents/${id}/similar`).then(readJson);

export const updateCodeStatus = (
  incidentId: string,
  structure: OiicsStructure,
  status: Extract<IncidentCodeStatus, 'HUMAN_CONFIRMED' | 'NEEDS_REVIEW'>,
): Promise<IncidentDetail> =>
  fetch(`${API_BASE_URL}/incidents/${incidentId}/codes/${structure}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }).then(readJson);

export const formatIncidentDate = (iso: string | null): string =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

export const formatConfidence = (confidence: number): string =>
  `${Math.round(confidence * 100)}%`;

export const formatSimilarity = (similarity: number): string =>
  `${(similarity * 100).toFixed(1)}%`;
