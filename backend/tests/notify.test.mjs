import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('cooldown suppresses repeats', async () => {
  const { shouldAlert } = await import('../src/notify.js');
  assert.equal(shouldAlert('a', {}, 0, 3600000), true);
  assert.equal(shouldAlert('a', { a: 1000 }, 2000, 3600000), false);
  assert.equal(shouldAlert('a', { a: 1000 }, 3600001 + 1000, 3600000), true);
});

test('builds thai alert text', async () => {
  const { buildAlert } = await import('../src/notify.js');
  const m = buildAlert('offline', { name: 'สวิทซ์ห้องนอน' });
  assert.ok(m.title.includes('หลุด'));
  assert.ok(m.body.includes('สวิทซ์ห้องนอน'));
  const t = buildAlert('heat', { temp: 65 });
  assert.ok(t.body.includes('65'));
});

test('detects offline power and heat', async () => {
  const { detectAlerts } = await import('../src/notify.js');
  const prev = { a: true };
  const d = { devices: [{ id: 'a', name: 'A', online: false }], power: { meter: { powerW: 5000 }, solar: { temp: 65 } } };
  const out = detectAlerts(prev, d, { powerLimit: 4000 });
  const keys = out.map((x) => x[0]);
  assert.ok(keys.includes('a:offline'));
  assert.ok(keys.includes('power'));
  assert.ok(keys.includes('heat'));
  assert.deepEqual(detectAlerts(prev, { devices: [{ id: 'a', name: 'A', online: true }] }), []);
});

test('sends to subs and drops dead ones', async () => {
  const { saveSubs, loadSubs, sendAll } = await import('../src/notify.js');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'push-'));
  const subs = [{ endpoint: 'https://x/1', keys: {} }, { endpoint: 'https://x/2', keys: {} }];
  saveSubs(dir, subs);
  assert.equal(loadSubs(dir).length, 2);
  const sent = [];
  const dead = await sendAll(dir, { title: 't', body: 'b' }, async (s) => { sent.push(s.endpoint); if (s.endpoint.endsWith('/2')) { const e = new Error('gone'); e.statusCode = 410; throw e; } });
  assert.deepEqual(sent, ['https://x/1', 'https://x/2']);
  assert.deepEqual(dead, ['https://x/2']);
  assert.equal(loadSubs(dir).length, 1);
});
