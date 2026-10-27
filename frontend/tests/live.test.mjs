import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('stale detection', async () => {
  const { isStale, staleMinutes } = await import('../src/hooks/useLive.js');
  assert.equal(isStale(Date.now() - 2000, 5000), false);
  assert.equal(isStale(Date.now() - 20000, 5000), true);
  assert.equal(staleMinutes(Date.now() - 20 * 60000) >= 19, true);
});
