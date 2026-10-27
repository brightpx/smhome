import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import fs from 'node:fs';

test('theme has liquid glass tokens', () => {
  const css = fs.readFileSync('frontend/src/theme.css', 'utf8');
  assert.ok(css.includes('--accent'));
  assert.ok(css.includes('#0a84ff'));
  assert.ok(css.includes('blur(10px)'));
});
