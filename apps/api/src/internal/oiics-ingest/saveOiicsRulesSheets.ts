import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as ExcelJS from 'exceljs';
import { OIICS_RULES_SHEETS } from './constants';
import { readWorkbookCellText } from './readWorkbookCellText';

export const saveOiicsRulesSheets = (
  workbook: ExcelJS.Workbook,
  outputDir: string,
): string[] => {
  mkdirSync(outputDir, { recursive: true });
  const savedFiles: string[] = [];
  for (const {
    sheetName,
    fileName,
    startHeading,
    endHeading,
  } of OIICS_RULES_SHEETS) {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) {
      console.warn(
        `Rules sheet "${sheetName}" not found in workbook — skipping`,
      );
      continue;
    }
    const lines = sliceLinesBetweenHeadings(
      formatSheetAsLines(sheet),
      startHeading,
      endHeading,
    );
    const filePath = join(outputDir, fileName);
    writeFileSync(filePath, lines.join('\n') + '\n');
    savedFiles.push(filePath);
  }
  return savedFiles;
};

const sliceLinesBetweenHeadings = (
  lines: string[],
  startHeading?: string,
  endHeading?: string,
): string[] => {
  const startIndex = startHeading ? lines.indexOf(startHeading) : 0;
  const endIndex = endHeading ? lines.indexOf(endHeading) : -1;
  if (startHeading && startIndex === -1) {
    console.warn(
      `Rules heading "${startHeading}" not found — keeping full sheet text`,
    );
  }
  if (endHeading && endIndex === -1) {
    console.warn(
      `Rules heading "${endHeading}" not found — keeping text through end of sheet`,
    );
  }
  return lines.slice(
    Math.max(startIndex, 0),
    endIndex === -1 ? lines.length : endIndex,
  );
};

const formatSheetAsLines = (sheet: ExcelJS.Worksheet): string[] => {
  const lines: string[] = [];
  for (let rowNumber = 1; rowNumber <= sheet.rowCount; rowNumber++) {
    const cellTexts: string[] = [];
    sheet.getRow(rowNumber).eachCell({ includeEmpty: false }, (cell) => {
      const text = readWorkbookCellText(cell).trim();
      if (text) cellTexts.push(text);
    });
    if (cellTexts.length) lines.push(cellTexts.join(' | '));
  }
  return lines;
};
