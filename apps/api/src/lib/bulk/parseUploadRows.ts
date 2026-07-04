import * as ExcelJS from 'exceljs';

const cellText = (cell: ExcelJS.Cell): string => {
  try {
    return String(cell.text ?? '').trim();
  } catch {
    return '';
  }
};

const parseCsvLine = (line: string): string[] => {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = false;
      } else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
};

const parseCsv = (text: string): string[][] =>
  text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map(parseCsvLine);

const parseXlsx = async (buffer: Buffer): Promise<string[][]> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  const rows: string[][] = [];
  for (let n = 1; n <= sheet.rowCount; n++) {
    const row = sheet.getRow(n);
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => cells.push(cellText(cell)));
    rows.push(cells);
  }
  return rows;
};

const findNarrativeColumn = (headers: string[]): number => {
  const match = headers.findIndex((header) =>
    /narrative|description|incident|summary|detail/i.test(header),
  );
  if (match !== -1) return match;
  return 0;
};

export const parseUploadRows = async (
  buffer: Buffer,
  filename: string,
): Promise<string[]> => {
  const table = filename.toLowerCase().endsWith('.csv')
    ? parseCsv(buffer.toString('utf8'))
    : await parseXlsx(buffer);
  if (table.length < 2) return [];

  const [headers, ...rows] = table;
  const narrativeIndex = findNarrativeColumn(headers);
  return rows
    .map((row) => (row[narrativeIndex] ?? '').trim())
    .filter((narrative) => narrative.length > 0);
};
