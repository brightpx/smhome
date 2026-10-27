export const DEVICES = [
  { id: 'eb0b9857bf4d24e73aujri', name: 'Dual Channel Smart Meter', room: 'ภายนอก', type: 'meter', online: true },
  { id: 'eb050f906c2cbd90f0vmwd', name: 'BFAD ไมโครอินเวอร์เตอร์', room: 'ภายนอก', type: 'solar', online: true },
  { id: 'eb2c311bb821f7630c9wvg', name: 'สวิทซ์หน้าประตูทางเข้า', room: 'ภายนอก', type: 'switch', online: true },
  { id: 'eb19bec12f89f86d19aff6', name: 'สวิทซ์ระเบียงชั้นบน', room: 'ภายนอก', type: 'switch', online: true },
  { id: 'ebdfed963b861a03bfhgfi', name: 'สวิทช์ห้องนอน', room: 'ห้องนอน', type: 'switch', online: true },
  { id: 'eb0e07cbd548caba3ezvyt', name: 'สวิทซ์ห้องกินข้าว', room: 'ห้องกินข้าว', type: 'switch', online: true },
  { id: 'eb6830635d5a2f6bc0wycq', name: 'สวิทซ์ห้องครอบครัว', room: 'ห้องครอบครัว', type: 'switch', online: true },
  { id: 'ebc37d6f76fa6360f4c8wc', name: 'track light', room: 'ห้องครอบครัว', type: 'socket', online: true },
  { id: '022553357c87ce8b9eea', name: 'สวิตช์ประตู', room: 'บ้านเก่า', type: 'switch', online: true },
  { id: '022553357c87ce8b9f09', name: 'สวิทซ์ระเบียง', room: 'บ้านเก่า', type: 'switch', online: true },
  { id: 'eb544d4314590c19b4amnd', name: 'Smart Plug', room: 'My Home', type: 'socket', online: false },
  { id: 'ebcd2469ad249dfea9u5nn', name: 'ไฟผนัง', room: 'ห้องนอน', type: 'light', online: false },
  { id: 'eb536bcaa83e0319fayoug', name: 'ไฟฝ้า', room: 'ห้องครอบครัว', type: 'light', online: false },
  { id: 'eba62fbc9252c06f8bznpg', name: 'ไฟกลม', room: 'My Home', type: 'other', online: false },
  { id: 'eb9f9967accfa76ea2l1uc', name: 'Smart remote control', room: 'ห้องครอบครัว', type: 'remote', online: false }
];

import fs from 'node:fs';

export function getFile(maxAgeMs = 3600000) {
  try {
    const p = new URL('../../data/live.json', import.meta.url);
    const raw = fs.readFileSync(p, 'utf8');
    const snap = JSON.parse(raw);
    if (Date.now() - snap.updatedAt > maxAgeMs) return null;
    return snap;
  } catch {
    return null;
  }
}

export function guessType(d) {
  const t = `${d.device_type || ''} ${d.pid || ''}`.toLowerCase();
  if (t.includes('meter')) return 'meter';
  if (t.includes('inverter')) return 'solar';
  if (t.includes('breaker') || t.includes('switch')) return 'switch';
  if (t.includes('socket')) return 'socket';
  if (t.includes('light') || t.includes('strip')) return 'light';
  return 'other';
}

export async function fetchDevices({ cookie, fetchFn = fetch }) {
  const res = await fetchFn('https://us.device.tuya.ai/open-api/v1.0/m/sdf/device/pag/source-query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ project_id: '69459073', page_no: 1, page_size: 20 })
  });
  if (!res.ok) throw new Error(`tuya ${res.status}`);
  const j = await res.json();
  return (j.result.data || []).map((d) => ({
    id: d.device_id,
    name: d.device_name,
    room: d.installation_location,
    type: guessType(d),
    online: d.device_status === 1
  }));
}

let realCache = null;

export async function refreshReal(cookie) {
  if (!cookie) return null;
  const devices = await fetchDevices({ cookie });
  realCache = { devices, onCount: devices.filter((d) => d.online).length, updatedAt: Date.now(), stale: false, source: 'tuya-web' };
  return realCache;
}

export function getReal() {
  if (realCache && Date.now() - realCache.updatedAt < 30000) return realCache;
  return null;
}
export function pollAll() {
  const updatedAt = Date.now();
  const onCount = DEVICES.filter((d) => d.online).length;
  return { devices: DEVICES, onCount, updatedAt, stale: false };
}
