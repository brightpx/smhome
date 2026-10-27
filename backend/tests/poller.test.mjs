import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('parses properties into gangs and power', async () => {
  const { parseProps } = await import('../src/poller.js');
  const sw = parseProps('eb2c311bb821f7630c9wvg', [
    { code: 'switch_1', value_object: true },
    { code: 'switch_2', value_object: false },
    { code: 'countdown_1', value_object: 0 }
  ], ['S1', 'S2', 'S3']);
  assert.deepEqual(sw.gangs, [{ name: 'S1', on: true }, { name: 'S2', on: false }, { name: 'S3', on: false }]);
  const m = parseProps('eb0b9857bf4d24e73aujri', [
    { code: 'p_tot', value_object: 3999 },
    { code: 'v', value_object: 2364 },
    { code: 'fwd_acc_kwh', value_object: 2321 },
    { code: 'rev_acc_kwh', value_object: 32 },
    { code: 'a_i', value_object: 2013 },
    { code: 'a_pf', value_object: 92 }
  ]);
  assert.equal(m.power.meter.powerW, 399.9);
  assert.equal(m.power.meter.currentA, 2013);
  assert.equal(m.power.meter.pf, 0.92);
  const s = parseProps('eb050f906c2cbd90f0vmwd', [
    { code: 'pv_power', value_object: 284 },
    { code: 'ac_power', value_object: 279 },
    { code: 'temp_current', value_object: 40 }
  ]);
  assert.equal(s.power.solar.pvW, 28.4);
});
