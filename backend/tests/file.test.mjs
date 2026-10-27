import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('reads live snapshot file when fresh', async () => {
  const { getFile } = await import('../src/tuyaWeb.js');
  const snap = getFile();
  assert.ok(snap);
  assert.equal(snap.devices.length, 15);
  assert.equal(snap.source, 'tuya-web');
  assert.equal(snap.power.meter.powerW, 372.1);
  assert.equal(snap.power.solar.pvW, 113.4);
});
