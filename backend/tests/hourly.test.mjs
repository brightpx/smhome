import { strict as assert } from 'node:assert';
import { test } from 'node:test';

function fixture() {
  const time = [];
  const temperature_2m = [];
  const weather_code = [];
  const precipitation_probability = [];
  for (let h = 0; h < 48; h++) {
    const d = new Date(Date.UTC(2026, 9, 28, h));
    time.push(d.toISOString().slice(0, 16));
    temperature_2m.push(25 + h * 0.1);
    weather_code.push(h < 24 ? 1 : 61);
    precipitation_probability.push(h < 24 ? 5 : 80);
  }
  return { hourly: { time, temperature_2m, weather_code, precipitation_probability } };
}

test('nextHours returns 12 hours starting from current hour', async () => {
  const { nextHours } = await import('../src/poller.js');
  const now = Date.UTC(2026, 9, 28, 3, 25); // 10:25 Bangkok wall time
  const out = nextHours(fixture(), now, 12);
  const wallHour = (t) => new Date(t + 7 * 3600e3).getUTCHours();
  assert.equal(out.length, 12);
  assert.equal(wallHour(out[0].t), 7);
  assert.equal(wallHour(out[11].t), 18);
  assert.equal(typeof out[3].tempC, 'number');
  assert.equal(out[3].code, 1);
  assert.equal(out[3].precip, 5);
});

test('nextHours rolls to next day rain codes', async () => {
  const { nextHours } = await import('../src/poller.js');
  const now = Date.UTC(2026, 9, 28, 13, 0); // 20:00 Bangkok wall time
  const out = nextHours(fixture(), now, 12);
  assert.equal(out.length, 12);
  assert.equal(out[7].code, 61);
  assert.equal(out[7].precip, 80);
});

test('nextHours includes 3 previous hours and flags current hour', async () => {
  const { nextHours } = await import('../src/poller.js');
  const now = Date.UTC(2026, 9, 28, 3, 25); // 10:25 Bangkok wall time
  const out = nextHours(fixture(), now, 12);
  const wallHour = (t) => new Date(t + 7 * 3600e3).getUTCHours();
  assert.equal(out.length, 12);
  assert.equal(wallHour(out[0].t), 7);
  const cur = out.find((h) => h.now);
  assert.ok(cur, 'one hour must be flagged current');
  assert.equal(wallHour(cur.t), 10);
});

test('nextHours prev param controls lookback', async () => {
  const { nextHours } = await import('../src/poller.js');
  const now = Date.UTC(2026, 9, 28, 3, 25); // 10:25 Bangkok wall time
  const wallHour = (t) => new Date(t + 7 * 3600e3).getUTCHours();
  const one = nextHours(fixture(), now, 12, 1);
  assert.equal(wallHour(one[0].t), 9);
  const zero = nextHours(fixture(), now, 12, 0);
  assert.equal(wallHour(zero[0].t), 10);
});
