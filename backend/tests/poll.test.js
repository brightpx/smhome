import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('GET /api/devices returns 15 devices with onCount 10', async () => {
  const { startServer } = await import('../src/server.js');
  const { url, close } = await startServer(0);
  try {
    const res = await fetch(`${url}/api/devices`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.devices));
    assert.equal(body.devices.length, 15);
    assert.equal(body.onCount, 10);
    assert.equal(typeof body.updatedAt, 'number');
  } finally {
    await close();
  }
});
