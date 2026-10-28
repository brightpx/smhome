import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('tou cost splits peak and offpeak', async () => {
  const { costOfKwh } = await import('../src/cost.js');
  // Monday 2026-10-26 10:00 local = peak
  assert.equal(costOfKwh(1, new Date(2026, 9, 26, 10, 0), { peak: 5.1135, offpeak: 2.6037 }), 5.1135);
  // Monday 23:00 = offpeak
  assert.equal(costOfKwh(1, new Date(2026, 9, 26, 23, 0), { peak: 5.1135, offpeak: 2.6037 }), 2.6037);
  // Saturday = offpeak all day
  assert.equal(costOfKwh(2, new Date(2026, 9, 31, 12, 0), { peak: 5.1135, offpeak: 2.6037 }), 5.2074);
});

test('/api/cost returns kwh and thb', async () => {
  const { startServer } = await import('../src/server.js');
  const { url, close } = await startServer(0);
  try {
    const r = await (await fetch(`${url}/api/cost`)).json();
    assert.ok(typeof r.kwh === 'number' && typeof r.thb === 'number');
  } finally {
    await close();
  }
});
test('daily cost sums history deltas', async () => {
  const { dailyCost } = await import('../src/cost.js');
  const rows = [
    { t: new Date(2026, 9, 26, 8, 55).getTime(), fwd: 20 },
    { t: new Date(2026, 9, 26, 9, 5).getTime(), fwd: 21 },
    { t: new Date(2026, 9, 26, 10, 5).getTime(), fwd: 22 }
  ];
  const r = dailyCost(rows, { peak: 5, offpeak: 2 });
  assert.ok(r.kwh >= 1.99 && r.kwh <= 2.01);
  assert.ok(r.thb > 0);
});
