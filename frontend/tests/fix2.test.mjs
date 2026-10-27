import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import fs from 'node:fs';

test('flow renders stale gray, theme hardened', async () => {
  const { renderFlow } = await import('../src/components/FlowCard.js');
  assert.ok(renderFlow({ solarKw: 0, homeKw: 0, stale: true }).includes('stale'));
  const css = fs.readFileSync('frontend/src/theme.css', 'utf8');
  assert.ok(css.includes('-webkit-backdrop-filter'));
  assert.ok(css.includes('min-width:0') || css.includes('min-width: 0'));
});
