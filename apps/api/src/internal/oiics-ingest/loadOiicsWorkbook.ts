// Libs
import * as ExcelJS from 'exceljs';

export const loadOiicsWorkbook = async (
  filePath: string,
): Promise<ExcelJS.Workbook> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return workbook;
};
