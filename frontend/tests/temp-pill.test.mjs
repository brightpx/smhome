import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('solar 52C renders warm pill', async () => {
  const { solarTempPill } = await import('../src/components/FlowCard.js');
  const html = solarTempPill(52);
  assert.ok(html.includes('52°C'), 'must show temp, got: ' + html);
  assert.ok(html.includes('pill warm'), 'must be warm pill, got: ' + html);
});

test('solar temp pill color thresholds', async () => {
  const { solarTempPill } = await import('../src/components/FlowCard.js');
  assert.ok(solarTempPill(65).includes('pill hot'));
  assert.ok(solarTempPill(40).includes('pill cool'));
  assert.equal(solarTempPill(null), '');
});
