import { startServer } from './server.js';
import { refreshReal } from './tuyaWeb.js';
import { recordSnapshot, readHistory } from './history.js';
import { pollOnce } from './poller.js';
import { shouldAlert, sendAll, detectAlerts } from './notify.js';
import { ensureVapidKeys } from './notify-vapid.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data/history');
const PROFILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data/profile');
const DATADIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data');
const lastSent = {};
let lastOnline = null;
const COOL = 60 * 60 * 1000;

async function checkAlerts() {
  try {
    const d = await (await fetch(`${url}/api/devices`)).json();
    if (!d || d.source === 'mock' || !Array.isArray(d.devices)) return;
    const now = Date.now();
    const alerts = detectAlerts(lastOnline, d, {});
    lastOnline = Object.fromEntries(d.devices.map((x) => [x.id, !!x.online]));
    const keys = await ensureVapidKeys().catch(() => null);
    if (!keys) return;
    const { default: webpush } = await import('web-push');
    webpush.setVapidDetails(keys.subject || 'mailto:admin@smarthome.local', keys.publicKey, keys.privateKey);
    for (const [key, msg] of alerts) {
      if (!shouldAlert(key, lastSent, now, COOL)) continue;
      await sendAll(DATADIR, msg, (s) => webpush.sendNotification(s, JSON.stringify(msg)));
      lastSent[key] = now;
    }
  } catch (e) {
    console.error('alerts failed:', e.message);
  }
}
setInterval(checkAlerts, 5 * 60 * 1000);
setTimeout(checkAlerts, 2 * 60 * 1000);
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || (process.env.PORT ? '0.0.0.0' : '127.0.0.1');
const { url } = await startServer(port, host);
console.log(`backend ready at ${url}`);
const snapOnce = async () => {
  try {
    const d = await (await fetch(`${url}/api/devices`)).json();
    if (d.source === 'mock') return;
    recordSnapshot(HIST, { t: Date.now(), meterW: d.power?.meter?.powerW ?? null, solarW: d.power?.solar?.acW ?? null, fwd: d.power?.meter?.forwardKwh ?? null, rev: d.power?.meter?.reverseKwh ?? null });
  } catch {}
};
snapOnce();
setInterval(snapOnce, 5 * 60 * 1000);

let autoOn = process.env.AUTO_POLL !== '0';
async function autoPoll() {
  if (!autoOn) return;
  try {
    const snap = await pollOnce(PROFILE);
    if (snap.login) {
      console.log('tuya login needed — scan QR at /api/qr');
    } else {
      snap.source = 'auto-poller';
      await fetch(`${url}/api/ingest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(snap) });
      console.log('auto-poll ok', new Date().toLocaleTimeString());
    }
  } catch (e) {
    console.error('auto-poll failed:', e.message);
  }
  setTimeout(autoPoll, 60000);
}
setTimeout(autoPoll, 15000);
try {
  const env = fs.readFileSync(new URL('../../.env', import.meta.url), 'utf8');
  const m = env.match(/TUYA_COOKIE=(.+)/);
  const cookie = (m ? m[1] : '').trim();
  if (cookie) {
    const tick = async () => {
      try { await refreshReal(cookie); } catch (e) { console.error('real poll failed:', e.message); }
      setTimeout(tick, 15000);
    };
    tick();
    console.log('real tuya-web polling enabled');
  } else {
    console.log('no TUYA_COOKIE in .env — serving mock until browser relay or cookie added');
  }
} catch {}
