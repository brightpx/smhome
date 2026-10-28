import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import fs from 'node:fs';

test('popup log requests 7-day history', async () => {
  const js = fs.readFileSync('frontend/app.js', 'utf8');
  assert.ok(js.includes('hours=168'), 'popup must request 168h history');
});
