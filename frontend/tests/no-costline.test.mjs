import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import fs from 'node:fs';

test('daily cost line removed from dashboard', async () => {
  const js = fs.readFileSync('frontend/app.js', 'utf8');
  assert.ok(!js.includes('costline'), 'costline must be gone');
  assert.ok(!js.includes('/api/cost'), 'cost fetch must be gone');
});
