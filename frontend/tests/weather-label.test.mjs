import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import fs from 'node:fs';

test('weather line labels Bang Khae Nuea', async () => {
  const js = fs.readFileSync('frontend/app.js', 'utf8');
  assert.ok(js.includes('บางแคเหนือ'), 'wxline must label home location');
});
