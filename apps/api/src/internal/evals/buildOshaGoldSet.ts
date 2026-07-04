import { createReadStream, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { GoldCase } from './types';

const CSV_PATH = process.argv[2];
const SAMPLE_SIZE = Number(process.argv[3] ?? 30);
const OUT_PATH = process.argv[4] ?? 'data/evals/osha-sir.jsonl';

const COLUMNS = {
  id: 0,
  narrative: 16,
  NATURE: [17, 18],
  PART_OF_BODY: [19, 20],
  EVENT: [21, 22],
  SOURCE: [23, 24],
} as const;

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

async function buildGoldSet() {
  if (!CSV_PATH)
    throw new Error('Provide the OSHA CSV path as the first argument');

  const qualifying: GoldCase[] = [];
  const rl = createInterface({ input: createReadStream(CSV_PATH) });
  let header = true;

  for await (const line of rl) {
    if (header) {
      header = false;
      continue;
    }
    const fields = parseCsvLine(line);
    const narrative = (fields[COLUMNS.narrative] ?? '').trim();
    if (narrative.length < 60 || narrative.length > 500) continue;

    const expected: GoldCase['expected'] = {};
    let complete = true;
    for (const structure of [
      'NATURE',
      'PART_OF_BODY',
      'EVENT',
      'SOURCE',
    ] as const) {
      const [codeIndex, titleIndex] = COLUMNS[structure];
      const code = (fields[codeIndex] ?? '').trim();
      const title = (fields[titleIndex] ?? '').trim();
      if (!code || !title) {
        complete = false;
        break;
      }
      expected[structure] = { code, title };
    }
    if (!complete) continue;

    qualifying.push({
      source: 'osha',
      id: fields[COLUMNS.id],
      narrative,
      expected,
    });
  }

  const stride = Math.max(1, Math.floor(qualifying.length / SAMPLE_SIZE));
  const sample: GoldCase[] = [];
  for (
    let i = 0;
    i < qualifying.length && sample.length < SAMPLE_SIZE;
    i += stride
  ) {
    sample.push(qualifying[i]);
  }

  writeFileSync(
    OUT_PATH,
    sample.map((c) => JSON.stringify(c)).join('\n') + '\n',
  );
  console.log(
    `${qualifying.length} qualifying rows → sampled ${sample.length} into ${OUT_PATH}`,
  );
}

buildGoldSet()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
