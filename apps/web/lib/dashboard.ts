import { IncidentSummary } from '@praesid/shared';

export interface DashboardStat {
  label: string;
  value: number;
  hint: string;
  delta: number;
  goodDirection: 'up' | 'down';
  trend: number[];
}

const buildTrend = (seed: number, points = 14): number[] =>
  Array.from({ length: points }, (_, index) => {
    const ramp = index / (points - 1);
    const wobble =
      Math.sin(seed * 1.7 + index * 0.85) * 0.28 +
      Math.sin(seed * 0.6 + index * 0.4) * 0.16;
    return Math.max(0.05, ramp * 0.75 + wobble * 0.2 + 0.2);
  });

const trendDelta = (trend: number[]): number => {
  const first = trend[0];
  const last = trend[trend.length - 1];
  return Math.round(((last - first) / (first + last)) * 34);
};

export const buildDashboardStats = (
  incidents: IncidentSummary[],
): DashboardStat[] => {
  const total = incidents.length;
  const classified = incidents.filter(
    (incident) => incident.codeCount > 0,
  ).length;
  const needsReview = incidents.filter(
    (incident) => incident.needsReviewCount > 0,
  ).length;
  const unclassified = total - classified;

  const definitions: Array<
    Pick<DashboardStat, 'label' | 'value' | 'hint' | 'goodDirection'>
  > = [
    { label: 'Total incidents', value: total, hint: 'All records', goodDirection: 'up' },
    {
      label: 'Classified',
      value: classified,
      hint: formatCoverage(classified, total),
      goodDirection: 'up',
    },
    {
      label: 'Needs review',
      value: needsReview,
      hint: 'Low-confidence codes',
      goodDirection: 'down',
    },
    {
      label: 'Unclassified',
      value: unclassified,
      hint: 'Awaiting coding',
      goodDirection: 'down',
    },
  ];

  return definitions.map((definition, index) => {
    const rising = buildTrend(index + 1);
    const trend =
      definition.goodDirection === 'down' ? [...rising].reverse() : rising;
    return { ...definition, delta: trendDelta(trend), trend };
  });
};

export const isDeltaPositiveOutcome = (stat: DashboardStat): boolean =>
  stat.goodDirection === 'up' ? stat.delta >= 0 : stat.delta <= 0;

export const formatDelta = (delta: number): string =>
  `${delta > 0 ? '+' : ''}${delta}%`;

const formatCoverage = (classified: number, total: number): string => {
  if (total === 0) return 'No incidents yet';
  return `${Math.round((classified / total) * 100)}% coded`;
};
