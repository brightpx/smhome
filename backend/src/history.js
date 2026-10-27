import fs from 'node:fs';
import path from 'node:path';

export function recordSnapshot(dir, row) {
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(path.join(dir, 'history.jsonl'), JSON.stringify(row) + '\n');
}

export function readHistory(dir, limit = 288) {
  try {
    const raw = fs.readFileSync(path.join(dir, 'history.jsonl'), 'utf8');
    return raw.trim().split('\n').slice(-limit).map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}
