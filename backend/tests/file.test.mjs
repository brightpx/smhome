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
  const front = snap.devices.find((d) => d.id === 'eb2c311bb821f7630c9wvg');
  assert.deepEqual(front.gangs.map((g) => g.on), [false, false, false]);
  const fam = snap.devices.find((d) => d.id === 'eb6830635d5a2f6bc0wycq');
  assert.equal(fam.gangs.find((g) => g.name === 'Circle').on, true);
});
