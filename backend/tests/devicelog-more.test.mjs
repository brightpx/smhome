import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEVLOG = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data/device-log.jsonl');

test('devicelog popup returns more than 50 rows', async () => {
  const backup = fs.existsSync(DEVLOG) ? fs.readFileSync(DEVLOG) : null;
  const { startServer } = await import('../src/server.js');
  const { url, close } = await startServer(0);
  try {
    let on = false;
    for (let i = 0; i < 70; i++) {
      on = !on;
      await fetch(`${url}/api/ingest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ devices: [{ id: 'hist1', name: 'H', online: true, gangs: [{ name: 'S1', on }] }], updatedAt: Date.now() }) });
    }
    const log = await (await fetch(`${url}/api/devicelog?dev_id=hist1`)).json();
    assert.ok(log.length > 50, 'expected >50 rows, got ' + log.length);
  } finally {
    await close();
    if (backup === null) { try { fs.unlinkSync(DEVLOG); } catch {} }
    else fs.writeFileSync(DEVLOG, backup);
  }
});
