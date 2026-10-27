import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('builds cookie header and rewrites tuya proxy headers', async () => {
  const { buildCookieHeader, tuyaHeaders } = await import('../src/poller.js');
  const h = buildCookieHeader([{ name: 'a', value: '1', domain: '.tuya.ai' }, { name: 'b', value: '2', domain: 'other.com' }]);
  assert.ok(h.includes('a=1'));
  assert.ok(!h.includes('b=2'));
  const t = tuyaHeaders({ origin: 'http://127.0.0.1:3001/x', cookie: 'a=1' }, 'a=1; c=3');
  assert.equal(t.origin, 'https://us.device.tuya.ai');
  assert.ok(t.cookie.includes('a=1'));
});
