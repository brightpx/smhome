import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('qr endpoint 404 when no login needed', async () => {
  const { startServer } = await import('../src/server.js');
  const { url, close } = await startServer(0);
  try {
    const r = await fetch(`${url}/api/qr`);
    assert.equal(r.status, 404);
    const st = await (await fetch(`${url}/api/status`)).json();
    assert.equal(st.loginNeeded, false);
  } finally {
    await close();
  }
});

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
