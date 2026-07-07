import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { OIICS_STRUCTURES, OiicsStructure } from '@praesid/shared';
import { OIICS_RULES_DIR, OIICS_RULES_FILES } from '../../constants/oiics';

let cachedRules: Record<OiicsStructure, string> | null = null;

export const loadOiicsRules = (): Record<OiicsStructure, string> => {
  if (!cachedRules) {
    cachedRules = Object.fromEntries(
      OIICS_STRUCTURES.map((structure) => [
        structure,
        readFileSync(
          join(OIICS_RULES_DIR, OIICS_RULES_FILES[structure]),
          'utf8',
        ).trim(),
      ]),
    ) as Record<OiicsStructure, string>;
  }
  return cachedRules;
};
