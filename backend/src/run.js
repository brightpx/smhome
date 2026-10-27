import { startServer } from './server.js';
import { refreshReal } from './tuyaWeb.js';
import { recordSnapshot } from './history.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data/history');
const port = Number(process.env.PORT || 3001);
const { url } = await startServer(port);
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
