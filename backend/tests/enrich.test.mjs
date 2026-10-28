import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('enriches relay devices with registry type and gangs', async () => {
  const { enrichDevices } = await import('../src/tuyaWeb.js');
  const registry = [
    { id: 'm1', name: 'Meter', room: 'นอก', type: 'meter', gangs: [{ name: 'x', on: false }] },
    { id: 's1', name: 'Sw', room: 'ใน', type: 'switch', gangs: [{ name: 'S1', on: false }] }
  ];
  const live = [
    { id: 'm1', name: 'Meter', room: 'My Home ../ภายนอก', online: true },
    { id: 's1', name: 'Sw', room: 'ใน', online: true, gangs: [{ name: 'S1', on: true }] }
  ];
  const out = enrichDevices(live, registry);
  assert.equal(out.find((d) => d.id === 'm1').type, 'meter');
  assert.equal(out.find((d) => d.id === 'm1').room, 'ภายนอก');
  assert.equal(out.find((d) => d.id === 'm1').gangs[0].on, false);
  assert.equal(out.find((d) => d.id === 's1').gangs[0].on, true);
});

test('namemap overrides names keeping states', async () => {
  const { enrichDevices } = await import('../src/tuyaWeb.js');
  const live = [{ id: 'x', name: 'X', room: 'R', online: true, gangs: [{ name: 'old', on: true }, { name: 'old2', on: false }] }];
  const out = enrichDevices(live, [], { x: ['A', 'B'] });
  assert.deepEqual(out[0].gangs.map((g) => g.name), ['A', 'B']);
  assert.deepEqual(out[0].gangs.map((g) => g.on), [true, false]);
});
