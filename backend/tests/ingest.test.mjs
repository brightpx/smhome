import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('ingest relay from browser tab', async () => {
  const { startServer } = await import('../src/server.js');
  const { url, close } = await startServer(0);
  try {
    const payload = { devices: [{ id: 'x', online: true }], updatedAt: Date.now(), source: 'browser-relay' };
    const r = await fetch(`${url}/api/ingest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    assert.equal(r.status, 200);
    const d = await (await fetch(`${url}/api/devices`)).json();
    assert.equal(d.source, 'browser-relay');
  } finally {
    await close();
  }
});
