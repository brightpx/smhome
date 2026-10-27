import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('ingest relay fills onCount', async () => {
  const { startServer } = await import('../src/server.js');
  const { url, close } = await startServer(0);
  try {
    await fetch(`${url}/api/ingest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ devices: [{ id: 'x', online: true }], updatedAt: Date.now() }) });
    const d = await (await fetch(`${url}/api/devices`)).json();
    assert.equal(d.source, 'browser-relay');
    assert.equal(d.onCount, 1);
  } finally {
    await close();
  }
});
