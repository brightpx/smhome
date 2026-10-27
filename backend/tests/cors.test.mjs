import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('cors preflight for browser relay', async () => {
  const { startServer } = await import('../src/server.js');
  const { url, close } = await startServer(0);
  try {
    const pre = await fetch(`${url}/api/ingest`, { method: 'OPTIONS' });
    assert.equal(pre.status, 204);
    assert.ok(pre.headers.get('access-control-allow-origin'));
    const r = await fetch(`${url}/api/devices`);
    assert.ok(r.headers.get('access-control-allow-origin'));
  } finally {
    await close();
  }
});
