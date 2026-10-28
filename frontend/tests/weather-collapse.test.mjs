import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import fs from 'node:fs';

test('hourly card is collapsible and remembers state', async () => {
  const js = fs.readFileSync('frontend/app.js', 'utf8');
  assert.ok(js.includes('toggleWxHour'), 'must have collapse toggle handler');
  assert.ok(js.includes('wxhourCollapsed'), 'must persist collapse state');
});
