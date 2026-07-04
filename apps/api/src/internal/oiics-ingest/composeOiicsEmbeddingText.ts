import { OIICS_STRUCTURE_LABELS } from '../../constants/oiics';
import { ParsedOiicsCode } from './parseOiicsCodeSheets';

export const composeOiicsEmbeddingText = (code: ParsedOiicsCode): string => {
  const structureLabel = OIICS_STRUCTURE_LABELS[code.structure];
  const includeParentTitle = code.hierarchyLevel >= 3 && code.parentTitle;
  const path = [
    structureLabel,
    includeParentTitle ? code.parentTitle : null,
    code.title,
  ]
    .filter(Boolean)
    .join(' > ');

  const sentences = [`${path}.`];
  if (code.definition) sentences.push(endWithPeriod(code.definition));
  if (code.includes)
    sentences.push(`Includes: ${endWithPeriod(code.includes)}`);
  if (code.excludes)
    sentences.push(`Excludes: ${endWithPeriod(code.excludes)}`);
  return collapseWhitespace(sentences.join(' '));
};

const endWithPeriod = (text: string): string =>
  /[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`;

const collapseWhitespace = (text: string): string =>
  text.replace(/\s+/g, ' ').trim();
