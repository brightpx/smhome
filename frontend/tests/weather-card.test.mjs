import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import fs from 'node:fs';

test('weather card renders hourly strip with icons', async () => {
  const js = fs.readFileSync('frontend/app.js', 'utf8');
  assert.ok(js.includes('wxhour'), 'must render hourly strip container');
  assert.ok(js.includes('wxIcon'), 'must map weather codes to icons');
  assert.ok(js.includes('ตอนนี้'), 'must highlight current hour');
  assert.ok(js.includes('hh.now'), 'must flag current hour from data, not position');
});
