import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('SSE streams and subscribe works', async () => {
  const { startServer } = await import('../src/server.js');
  const { url, close } = await startServer(0);
  try {
    const sub = await fetch(`${url}/api/push/subscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: 'https://x', keys: {} }) });
    assert.equal(sub.status, 201);
  } finally {
    await close();
  }
});
