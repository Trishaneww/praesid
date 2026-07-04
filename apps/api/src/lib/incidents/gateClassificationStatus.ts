import { IncidentCodeStatus } from '@praesid/shared';
import {
  AUTO_CONFIDENCE_THRESHOLD,
  AUTO_SIMILARITY_THRESHOLD,
} from '../../constants/classification';

export const gateClassificationStatus = (params: {
  modelConfidence: number;
  retrievalSimilarity: number | null;
}): IncidentCodeStatus =>
  params.modelConfidence >= AUTO_CONFIDENCE_THRESHOLD &&
  (params.retrievalSimilarity ?? 0) >= AUTO_SIMILARITY_THRESHOLD
    ? 'AUTO'
    : 'NEEDS_REVIEW';
