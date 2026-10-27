import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('serves frontend page with flow and devices', async () => {
  const { startServer } = await import('../src/server.js');
  const { url, close } = await startServer(0);
  try {
    const html = await (await fetch(`${url}/`)).text();
    assert.ok(html.includes('Smart Home'));
    assert.ok(html.includes('flow'));
    const js = await (await fetch(`${url}/app.js`)).text();
    assert.ok(js.includes('/api/devices'));
    const css = await (await fetch(`${url}/theme.css`)).text();
    assert.ok(css.includes('.panel'));
    assert.ok(css.includes('.td-title'));
  } finally {
    await close();
  }
});
