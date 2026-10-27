import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('records and reads energy history', async () => {
  const { recordSnapshot, readHistory } = await import('../src/history.js');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hist-'));
  recordSnapshot(dir, { t: 1000, meterW: 372.1, solarW: 113.4, fwd: 22.91, rev: 0.32 });
  recordSnapshot(dir, { t: 2000, meterW: 350, solarW: 120, fwd: 22.92, rev: 0.32 });
  const rows = readHistory(dir, 10);
  assert.equal(rows.length, 2);
  assert.equal(rows[1].solarW, 120);
});
