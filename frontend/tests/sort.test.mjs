import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('sorts devices: energy first, on before off, offline last', async () => {
  const { sortDevices } = await import('../src/components/DeviceList.js');
  const devs = [
    { id: 'a', name: 'A', room: 'R', type: 'switch', online: true, gangs: [{ name: 'S1', on: false }] },
    { id: 'b', name: 'B', room: 'R', type: 'switch', online: false },
    { id: 'c', name: 'C', room: 'R', type: 'meter', online: true },
    { id: 'd', name: 'D', room: 'R', type: 'switch', online: true, gangs: [{ name: 'S1', on: true }] }
  ];
  const sorted = sortDevices(devs).map((d) => d.id);
  assert.deepEqual(sorted, ['c', 'd', 'a', 'b']);
});
