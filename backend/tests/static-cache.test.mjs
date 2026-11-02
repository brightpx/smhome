import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('static assets send no-cache headers', async () => {
  const { startServer } = await import('../src/server.js');
  const { url, close } = await startServer(0);
  try {
    for (const p of ['/app.js', '/theme.css', '/index.html']) {
      const r = await fetch(`${url}${p}`);
      assert.equal(r.status, 200, p);
      const cc = r.headers.get('cache-control') || '';
      assert.ok(cc.includes('no-cache') || cc.includes('no-store'), p + ' must not be cached, got: ' + cc);
    }
  } finally {
    await close();
  }
});
