import { OiicsClassificationCandidate } from '../../oiics/oiics.service';

export const formatCandidatesForPrompt = (
  candidates: OiicsClassificationCandidate[],
): string =>
  candidates
    .map((candidate) => {
      const lines = [`[${candidate.code}] ${candidate.title}`];
      if (candidate.definition)
        lines.push(`  Definition: ${candidate.definition}`);
      if (candidate.includes) lines.push(`  Includes: ${candidate.includes}`);
      if (candidate.excludes) lines.push(`  Excludes: ${candidate.excludes}`);
      if (candidate.codingInteractions)
        lines.push(`  Coding interactions: ${candidate.codingInteractions}`);
      return lines.join('\n');
    })
    .join('\n\n');
