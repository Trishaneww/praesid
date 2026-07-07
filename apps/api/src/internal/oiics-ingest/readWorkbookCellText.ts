import * as ExcelJS from 'exceljs';

// exceljs throws on merged cells whose master value is null, so cell.text is never read directly.
export const readWorkbookCellText = (cell: ExcelJS.Cell): string => {
  try {
    return String(cell.text ?? '');
  } catch {
    return '';
  }
};
