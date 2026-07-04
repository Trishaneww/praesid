import { OiicsStructure } from '../generated/prisma/enums';

export const CURRENT_OIICS_VERSION = '3.02';
export const OIICS_SEARCH_CANDIDATE_LIMIT = 5;
export const OIICS_RULES_DIR = 'data/oiics/rules';

export const OIICS_STRUCTURE_LABELS: Record<OiicsStructure, string> = {
  NATURE: 'Nature of injury',
  PART_OF_BODY: 'Part of body',
  EVENT: 'Event or exposure',
  SOURCE: 'Source of injury',
  WORKER_ACTIVITY: 'Worker activity',
  LOCATION: 'Location',
};
