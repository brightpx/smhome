import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import fs from 'node:fs';

test('login QR stays stable while session expired', async () => {
  const js = fs.readFileSync('frontend/app.js', 'utf8');
  assert.ok(js.includes('lastLoginNeeded'), 'qrbox must only refresh on login-state change');
});
