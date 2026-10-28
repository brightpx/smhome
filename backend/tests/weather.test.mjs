import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('home coords default to Bang Khae Nuea', async () => {
  delete process.env.HOME_LAT;
  delete process.env.HOME_LON;
  const { homeCoords } = await import('../src/poller.js');
  const c = homeCoords();
  assert.ok(Math.abs(Number(c.lat) - 13.71) < 0.05, 'lat near Bang Khae Nuea, got ' + c.lat);
  assert.ok(Math.abs(Number(c.lon) - 100.41) < 0.05, 'lon near Bang Khae Nuea, got ' + c.lon);
});

test('home coords respect env override', async () => {
  process.env.HOME_LAT = '13.75';
  process.env.HOME_LON = '100.50';
  try {
    const { homeCoords } = await import('../src/poller.js');
    const c = homeCoords();
    assert.equal(c.lat, '13.75');
    assert.equal(c.lon, '100.50');
  } finally {
    delete process.env.HOME_LAT;
    delete process.env.HOME_LON;
  }
});
