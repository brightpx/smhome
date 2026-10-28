import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('weather endpoint returns graceful shape', async () => {
  const { startServer } = await import('../src/server.js');
  const { url, close } = await startServer(0);
  try {
    const r = await (await fetch(`${url}/api/weather`)).json();
    assert.ok(typeof r.tempC === 'number' || r.error === 'weather-unavailable');
  } finally {
    await close();
  }
});
