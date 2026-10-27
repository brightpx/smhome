import { startServer } from './server.js';
import { refreshReal } from './tuyaWeb.js';
import fs from 'node:fs';
const port = Number(process.env.PORT || 3001);
const { url } = await startServer(port);
console.log(`backend ready at ${url}`);
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
