import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('flow math and grouping', async () => {
  const { calcGrid, fmtSolarW } = await import('../src/components/FlowCard.js');
  assert.equal(calcGrid(2.4, 1.8), 0.6);
  assert.equal(fmtSolarW(25.9), '26 W');
  assert.equal(fmtSolarW(null), '—');
  const { groupOn } = await import('../src/components/DeviceList.js');
  const { DEVICES } = await import('../../backend/src/tuyaWeb.js');
  const grouped = groupOn(DEVICES);
  assert.equal(Object.keys(grouped).length, 5);
  const total = Object.values(grouped).reduce((n, a) => n + a.length, 0);
  assert.equal(total, 10);
});
