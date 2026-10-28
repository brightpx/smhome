import fs from 'node:fs';
import path from 'node:path';

export function subsFile(dir) {
  return path.join(dir, 'push-subs.json');
}

export function loadSubs(dir) {
  try {
    return JSON.parse(fs.readFileSync(subsFile(dir), 'utf8'));
  } catch {
    return [];
  }
}

export function saveSubs(dir, subs) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(subsFile(dir), JSON.stringify(subs));
}

export function shouldAlert(key, lastSent, now, cooldownMs) {
  return !(lastSent[key] && now - lastSent[key] < cooldownMs);
}

export function buildAlert(type, d = {}) {
  if (type === 'offline') return { title: 'อุปกรณ์หลุด', body: `${d.name || d.id} ออฟไลน์แล้ว` };
  if (type === 'meter-offline') return { title: 'มิเตอร์หลุด', body: 'มิเตอร์ไม่ส่งค่า อาจไฟดับหรืออุปกรณ์มีปัญหา' };
  if (type === 'power') return { title: 'ใช้ไฟสูง', body: `ใช้ไฟ ${d.w}W เกิน ${d.limit}W ที่ตั้งไว้` };
  if (type === 'heat') return { title: 'อินเวอร์เตอร์ร้อนจัด', body: `อุณหภูมิ ${d.temp}°C เกิน 60°C โซล่าอาจผลิตตก` };
  return { title: 'Smart Home', body: d.text || '' };
}

export async function sendAll(dir, payload, sender) {
  const subs = loadSubs(dir);
  const dead = [];
  await Promise.all(subs.map(async (s) => {
    try {
      await sender(s, payload);
    } catch (e) {
      if (e && (e.statusCode === 404 || e.statusCode === 410)) dead.push(s.endpoint);
    }
  }));
  if (dead.length) saveSubs(dir, subs.filter((s) => !dead.includes(s.endpoint)));
  return dead;
}

export function detectAlerts(prevOnline, d, opts = {}) {
  const out = [];
  const limit = Number(opts.powerLimit || process.env.POWER_ALERT_W || 4000);
  const heatAt = Number(opts.heatAt || 60);
  for (const dev of d.devices || []) {
    const was = prevOnline ? prevOnline[dev.id] : undefined;
    if (was === true && !dev.online) {
      out.push([dev.id + ':offline', dev.id === 'eb0b9857bf4d24e73aujri' ? buildAlert('meter-offline', dev) : buildAlert('offline', dev)]);
    }
  }
  if (d.power && d.power.meter && d.power.meter.powerW > limit) {
    out.push(['power', buildAlert('power', { w: Math.round(d.power.meter.powerW), limit })]);
  }
  if (d.power && d.power.solar && d.power.solar.temp >= heatAt) {
    out.push(['heat', buildAlert('heat', { temp: d.power.solar.temp })]);
  }
  return out;
}
