import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('detects gang and online changes', async () => {
  const { diffSnapshots } = await import('../src/changes.js');
  const prev = { devices: [
    { id: 'a', name: 'A', online: true, gangs: [{ name: 'S1', on: false }] },
    { id: 'b', name: 'B', online: true }
  ] };
  const curr = { devices: [
    { id: 'a', name: 'A', online: true, gangs: [{ name: 'S1', on: true }] },
    { id: 'b', name: 'B', online: false }
  ] };
  const ev = diffSnapshots(prev, curr, 999);
  assert.equal(ev.length, 2);
  assert.equal(ev[0].device_id, 'a');
  assert.ok(ev[0].detail.includes('S1'));
  assert.equal(ev[1].kind, 'online');
});
