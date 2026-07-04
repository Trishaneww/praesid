// Libs
import { OiicsStructure } from '../../generated/prisma/enums';

export const OIICS_WORKBOOK_PATH = 'data/oiics/oiics-3.02.xlsx';

export const OIICS_CODE_SHEETS: {
  sheetName: string;
  structure: OiicsStructure;
}[] = [
  { sheetName: '2.b. Nature Codes', structure: 'NATURE' },
  { sheetName: '3.b. Part Codes', structure: 'PART_OF_BODY' },
  { sheetName: '4.b. Event Codes', structure: 'EVENT' },
  { sheetName: '5.b. Source Codes', structure: 'SOURCE' },
  { sheetName: '6.b. WA Codes', structure: 'WORKER_ACTIVITY' },
  { sheetName: '6.c. Location Codes', structure: 'LOCATION' },
];

export const OIICS_RULES_SHEETS: {
  sheetName: string;
  fileName: string;
  startHeading?: string;
  endHeading?: string;
}[] = [
  { sheetName: '2.a. Nature Rules', fileName: 'nature-rules.txt' },
  { sheetName: '3.a. Part Rules', fileName: 'part-rules.txt' },
  { sheetName: '4.a. Event Rules', fileName: 'event-rules.txt' },
  { sheetName: '5.a. Source Rules', fileName: 'source-rules.txt' },
  {
    sheetName: '6.a. WA and location rules',
    fileName: 'worker-activity-rules.txt',
    startHeading: 'WORKER ACTIVITY',
    endHeading: 'LOCATION',
  },
  {
    sheetName: '6.a. WA and location rules',
    fileName: 'location-rules.txt',
    startHeading: 'LOCATION',
  },
];
