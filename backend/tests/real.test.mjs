import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('maps real api response to devices', async () => {
  const { fetchDevices } = await import('../src/tuyaWeb.js');
  const fakeFetch = async () => ({
    ok: true,
    json: async () => ({ result: { data: [
      { device_id: 'a1', device_name: 'มิเตอร์', installation_location: 'ภายนอก', device_status: 1 },
      { device_id: 'b2', device_name: 'ไฟ', installation_location: 'นอน', device_status: 0 }
    ] } })
  });
  const devices = await fetchDevices({ cookie: 'x', fetchFn: fakeFetch });
  assert.equal(devices.length, 2);
  assert.deepEqual(devices[0], { id: 'a1', name: 'มิเตอร์', room: 'ภายนอก', type: 'other', online: true });
  assert.equal(devices[1].online, false);
});
