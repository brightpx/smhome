import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import fs from 'node:fs';

test('solar temp shown once in power detail, not in weather line', async () => {
  const js = fs.readFileSync('frontend/app.js', 'utf8');
  const wxLine = js.split('\n').find((l) => l.includes('บางแคเหนือ'));
  assert.ok(wxLine && !wxLine.includes('อินเวอร์เตอร์'), 'weather line must not duplicate inverter temp, got: ' + wxLine);
  assert.ok(js.includes('ร้อนจัด'), 'heat warning must be kept in power detail');
});
