import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import fs from 'node:fs';

test('grid import is red, export stays green', async () => {
  const js = fs.readFileSync('frontend/app.js', 'utf8');
  assert.ok(js.includes("grid <= 0 ? '#30d158' : '#ff453a'"), 'import must be red #ff453a, export green #30d158');
});
