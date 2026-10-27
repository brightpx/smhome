import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('push notify on offline', async () => {
  const { shouldNotify } = await import('../src/push.js');
  assert.equal(shouldNotify({ online: false }), true);
  assert.equal(shouldNotify({ online: true }), false);
  assert.equal(shouldNotify({ sessionExpired: true }), true);
});
