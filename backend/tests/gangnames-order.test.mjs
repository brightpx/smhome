import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import os from 'node:os';
import path from 'node:path';

// Ground truth: Tuya app panel left-to-right (switch_1..3) =
// ไฟกลมหลัง, ไฟกลมหน้า, ไฟดาวไลท์ (screenshot 2026-10-28)
test('sala switch gang order matches Tuya app', async () => {
  process.env.GANG_NAMES_FILE = path.join(os.tmpdir(), 'gang-order-nonexistent-' + Date.now() + '.json');
  try {
    const { getNames } = await import('../src/poller.js');
    assert.deepEqual(getNames('022553357c87ce8b9eea'), ['ไฟกลมหลัง', 'ไฟกลมหน้า', 'ไฟดาวไลท์']);
  } finally {
    delete process.env.GANG_NAMES_FILE;
  }
});

// Ground truth: Tuya app 2x2 grid (switch_1..4) =
// Strip1ft(ON), Circle1ft, ไฟหน้าประตู, Downlight1ft (screenshot 2026-10-28)
test('family room gang order matches Tuya app', async () => {
  process.env.GANG_NAMES_FILE = path.join(os.tmpdir(), 'gang-order-nonexistent-' + Date.now() + '.json');
  try {
    const { getNames } = await import('../src/poller.js');
    assert.deepEqual(getNames('eb6830635d5a2f6bc0wycq'), ['Strip1ft', 'Circle1ft', 'ไฟหน้าประตู', 'Downlight1ft']);
  } finally {
    delete process.env.GANG_NAMES_FILE;
  }
});

// Ground truth: Tuya app 2x2 grid (switch_1..4) =
// Downlight2sd, ห้องเก็บ, Circle2sd, Tricklightlink (screenshot 2026-10-28)
test('dining room gang order matches Tuya app', async () => {
  process.env.GANG_NAMES_FILE = path.join(os.tmpdir(), 'gang-order-nonexistent-' + Date.now() + '.json');
  try {
    const { getNames } = await import('../src/poller.js');
    assert.deepEqual(getNames('eb0e07cbd548caba3ezvyt'), ['Downlight2sd', 'ห้องเก็บ', 'Circle2sd', 'Tricklightlink']);
  } finally {
    delete process.env.GANG_NAMES_FILE;
  }
});

// Ground truth: Tuya app left-to-right (switch_1..3) =
// ระเบียง, ไฟสวย, ไฟสวย2 (screenshot 2026-10-28)
test('upper balcony gang order matches Tuya app', async () => {
  process.env.GANG_NAMES_FILE = path.join(os.tmpdir(), 'gang-order-nonexistent-' + Date.now() + '.json');
  try {
    const { getNames } = await import('../src/poller.js');
    assert.deepEqual(getNames('eb19bec12f89f86d19aff6'), ['ระเบียง', 'ไฟสวย', 'ไฟสวย2']);
  } finally {
    delete process.env.GANG_NAMES_FILE;
  }
});
