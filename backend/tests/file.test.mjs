import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('reads live snapshot file when fresh', async () => {
  const { getFile, pollAll } = await import('../src/tuyaWeb.js');
  const snap = getFile() || { ...pollAll(), source: 'mock' };
  assert.ok(snap);
  assert.equal(snap.devices.length, 15);
  assert.ok(['tuya-web', 'auto-poller', 'browser-relay'].includes(snap.source));
  assert.ok(snap.power.meter.powerW > 0);
  assert.ok(snap.power.solar.pvW >= 0);
  const front = snap.devices.find((d) => d.id === 'eb2c311bb821f7630c9wvg');
  assert.equal(front.gangs.length, 3);
  assert.ok(front.gangs.every((g) => typeof g.on === 'boolean'));
  const fam = snap.devices.find((d) => d.id === 'eb6830635d5a2f6bc0wycq');
  assert.equal(fam.gangs.length, 4);
  assert.ok(fam.gangs.every((g) => typeof g.name === 'string' && typeof g.on === 'boolean'));
});
