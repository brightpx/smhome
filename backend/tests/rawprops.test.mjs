import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('rawprops returns array or graceful error', async () => {
  const { startServer } = await import('../src/server.js');
  const { url, close } = await startServer(0);
  try {
    const r = await (await fetch(`${url}/api/rawprops?dev_id=xxx`)).json();
    assert.ok(Array.isArray(r) || r.error === 'tuya-props-unavailable');
  } finally {
    await close();
  }
});
