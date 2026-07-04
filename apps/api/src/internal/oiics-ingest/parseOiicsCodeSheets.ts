import * as ExcelJS from 'exceljs';
import { OiicsStructure } from '../../generated/prisma/enums';
import { OIICS_CODE_SHEETS } from './constants';
import { readWorkbookCellText } from './readWorkbookCellText';

export interface ParsedOiicsCode {
  structure: OiicsStructure;
  code: string;
  title: string;
  definition: string | null;
  includes: string | null;
  excludes: string | null;
  codingInteractions: string | null;
  notes: string | null;
  hierarchyRaw: string;
  hierarchyLevel: number;
  isSummary: boolean;
  parentCode: string | null;
  parentTitle: string | null;
}

const EXPECTED_HEADERS = [
  'Hierarchy',
  'Code',
  'Title',
  'Definition',
  'Includes',
  'Excludes',
  'Coding interactions',
  'Notes',
] as const;

type HeaderName = (typeof EXPECTED_HEADERS)[number];

export const parseOiicsCodeSheets = (
  workbook: ExcelJS.Workbook,
): ParsedOiicsCode[] => {
  const codes: ParsedOiicsCode[] = [];
  for (const { sheetName, structure } of OIICS_CODE_SHEETS) {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found in workbook`);
    }
    codes.push(...parseCodeSheet(sheet, structure));
  }
  return codes;
};

const parseCodeSheet = (
  sheet: ExcelJS.Worksheet,
  structure: OiicsStructure,
): ParsedOiicsCode[] => {
  const columnByHeader = mapColumnsByHeader(sheet);
  const rows: ParsedOiicsCode[] = [];
  // Nearest preceding row per hierarchy level, so each row can find its parent
  // without relying on code-string prefixes (the numbering does not always nest cleanly).
  const ancestorsByLevel: { code: string; title: string }[] = [];

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const readColumn = (header: HeaderName) =>
      readCellText(row, columnByHeader.get(header));

    const hierarchyRaw = readColumn('Hierarchy');
    const code = readColumn('Code');
    const title = readColumn('Title');
    if (!hierarchyRaw && !code && !title) continue; // spacer row

    const hierarchy = parseHierarchyCell(hierarchyRaw);
    if (!hierarchy || !code || !title) {
      console.warn(
        `[${structure}] skipping malformed row ${rowNumber}: hierarchy="${hierarchyRaw}" code="${code}" title="${title.slice(0, 40)}"`,
      );
      continue;
    }

    const { hierarchyLevel, isSummary } = hierarchy;
    if (code.length !== hierarchyLevel) {
      console.warn(
        `[${structure}] code "${code}" length does not match hierarchy level ${hierarchyLevel} (row ${rowNumber}) — check for lost leading zeros`,
      );
    }

    const parent =
      hierarchyLevel > 1
        ? (ancestorsByLevel[hierarchyLevel - 1] ?? null)
        : null;
    ancestorsByLevel[hierarchyLevel] = { code, title };
    ancestorsByLevel.length = hierarchyLevel + 1; // drop stale deeper ancestors

    rows.push({
      structure,
      code,
      title,
      definition: readColumn('Definition') || null,
      includes: readColumn('Includes') || null,
      excludes: readColumn('Excludes') || null,
      codingInteractions: readColumn('Coding interactions') || null,
      notes: readColumn('Notes') || null,
      hierarchyRaw,
      hierarchyLevel,
      isSummary,
      parentCode: parent?.code ?? null,
      parentTitle: parent?.title ?? null,
    });
  }
  return rows;
};

const mapColumnsByHeader = (
  sheet: ExcelJS.Worksheet,
): Map<HeaderName, number> => {
  const columnByHeader = new Map<HeaderName, number>();
  sheet.getRow(1).eachCell((cell, columnNumber) => {
    const header = normalizeCellText(readWorkbookCellText(cell));
    const match = EXPECTED_HEADERS.find(
      (expected) => expected.toLowerCase() === header.toLowerCase(),
    );
    if (match && !columnByHeader.has(match)) {
      columnByHeader.set(match, columnNumber);
    }
  });
  if (
    !columnByHeader.has('Hierarchy') ||
    !columnByHeader.has('Code') ||
    !columnByHeader.has('Title')
  ) {
    throw new Error(
      `Sheet "${sheet.name}" is missing required columns (Hierarchy, Code, Title)`,
    );
  }
  return columnByHeader;
};

const readCellText = (
  row: ExcelJS.Row,
  columnNumber: number | undefined,
): string => {
  if (!columnNumber) return '';
  return normalizeCellText(readWorkbookCellText(row.getCell(columnNumber)));
};

// Codes are read via cell.text so numeric cells ("10") and text cells ("0112") both come back as strings.
const normalizeCellText = (text: string): string =>
  String(text ?? '')
    .replace(/\u00a0/g, ' ')
    .trim();

const parseHierarchyCell = (
  hierarchyRaw: string,
): { hierarchyLevel: number; isSummary: boolean } | null => {
  const match = hierarchyRaw.match(/^(\d+)(s?)$/i);
  if (!match) return null;
  return {
    hierarchyLevel: Number(match[1]),
    isSummary: match[2].toLowerCase() === 's',
  };
};
