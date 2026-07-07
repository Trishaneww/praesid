import { OiicsStructure } from '@praesid/shared';

export interface GoldExpectation {
  code: string; // OSHA: OIICS 2.01 (reference); handwritten: OIICS 3.02 (authoritative)
  title?: string;
}

export interface GoldCase {
  source: 'osha' | 'handwritten';
  id: string;
  narrative: string;
  expected: Partial<Record<OiicsStructure, GoldExpectation>>;
}
