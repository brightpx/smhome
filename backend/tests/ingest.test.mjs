import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import os from 'node:os';
import path from 'node:path';

test('ingest relay fills onCount', async () => {
  const { startServer } = await import('../src/server.js');
  const { url, close } = await startServer(0);
  try {
    await fetch(`${url}/api/ingest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ devices: [{ id: 'x', online: true }], updatedAt: Date.now() }) });
    const d = await (await fetch(`${url}/api/devices`)).json();
    assert.equal(d.source, 'browser-relay');
    assert.equal(d.onCount, 1);
  } finally {
    await close();
  }
});

test('device log records gang flips', async () => {
  const { startServer } = await import('../src/server.js');
  const { url, close } = await startServer(0);
  try {
    await fetch(`${url}/api/ingest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ devices: [{ id: 'z1', name: 'Z', online: true, gangs: [{ name: 'S1', on: false }] }], updatedAt: Date.now() }) });
    await fetch(`${url}/api/ingest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ devices: [{ id: 'z1', name: 'Z', online: true, gangs: [{ name: 'S1', on: true }] }], updatedAt: Date.now() }) });
    const log = await (await fetch(`${url}/api/devicelog?dev_id=z1`)).json();
    assert.ok(Array.isArray(log));
    assert.ok(log.some((e) => e.device_id === 'z1' && e.detail.includes('S1')));
  } finally {
    await close();
  }
});

test('gangnames api get and set', async () => {
  process.env.GANG_NAMES_FILE = path.join(os.tmpdir(), 'gang-test-' + Date.now() + '.json');
  const { startServer } = await import('../src/server.js');
  const { url, close } = await startServer(0);
  try {
    await fetch(`${url}/api/gangnames`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'z9', names: ['A', 'B'] }) });
    const g = await (await fetch(`${url}/api/gangnames?dev_id=z9`)).json();
    assert.deepEqual(g.names, ['A', 'B']);
  } finally {
    delete process.env.GANG_NAMES_FILE;
    await close();
  }
});
