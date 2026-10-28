import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('GET /api/devices returns devices with onCount', async () => {
  const { startServer } = await import('../src/server.js');
  const { url, close } = await startServer(0);
  try {
    const res = await fetch(`${url}/api/devices`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.devices));
    assert.equal(body.devices.length, 15);
    assert.equal(body.onCount, body.devices.filter((d) => d.online).length);
    assert.equal(typeof body.updatedAt, 'number');
  } finally {
    await close();
  }
});
