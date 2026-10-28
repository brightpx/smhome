const METER = 'eb0b9857bf4d24e73aujri';
const INV = 'eb050f906c2cbd90f0vmwd';
const NAMES = {
  eb2c311bb821f7630c9wvg: ['ไฟเลขที่บ้าน', 'ไฟโรงรถ', 'ไฟหน้าบ้าน link'],
  eb19bec12f89f86d19aff6: ['ระเบียง', 'ไฟสวย', 'ไฟสวย2'],
  ebdfed963b861a03bfhgfi: ['Bedlight', 'Circle3', 'Strip3', 'Downlight3'],
  'eb0e07cbd548caba3ezvyt': ['Downlight2sd', 'ห้องเก็บ', 'Circle2sd', 'Tricklightlink'],
  'eb6830635d5a2f6bc0wycq': ['Strip1ft', 'Circle1ft', 'ไฟหน้าประตู', 'Downlight1ft'],
  '022553357c87ce8b9eea': ['ไฟกลมหลัง', 'ไฟกลมหน้า', 'ไฟดาวไลท์'],
  '022553357c87ce8b9f09': ['ไฟฝ้า', 'ไฟหน้าประตูหลัง', 'ไฟระเบียงหลัง']
};
const SW_IDS = Object.keys(NAMES);
const HEADERS = {
  'Content-Type': 'application/json;charset=UTF-8',
  'micro-app-code': '@tuya-fe/smart2c-app-device',
  'micro-app-id': '2031674305368031282',
  'project-id': '69459073',
  'isolation-type': 'homeId',
  'uid': 'az1650764274804vous3'
};
const num = (arr) => {
  const o = {};
  for (const e of arr) o[e.code] = e.value_object ?? e.value;
  return o;
};

export function parseProps(id, props, names) {
  const o = num(props);
  if (id === METER) {
    return { power: { meter: { powerW: o.p_tot / 10, voltage: o.v / 10, forwardKwh: o.fwd_acc_kwh / 100, reverseKwh: o.rev_acc_kwh / 100, currentA: o.a_i, pf: o.a_pf == null ? null : o.a_pf / 100 } } };
  }
  if (id === INV) {
    return { power: { solar: { pvW: o.pv_power / 10, acW: o.ac_power / 10, totalKwh: o.power_total / 1000, temp: o.temp_current } } };
  }
  const sw = Object.keys(o).filter((k) => /^switch_\d+$/.test(k)).sort();
  const count = Math.max(sw.length, (names || []).length);
  const gangs = [];
  for (let i = 0; i < count; i++) {
    gangs.push({ name: (names || [])[i] || ('switch_' + (i + 1)), on: String(o['switch_' + (i + 1)]) === 'true' });
  }
  return { gangs };
}

export function mergeSnapshot(devices, gangsById, power) {
  let p = null;
  for (const part of power) p = { ...(p || {}), ...part.power };
  return {
    devices: devices.map((d) => ({ ...d, gangs: gangsById[d.id] })),
    power: p,
    updatedAt: Date.now()
  };
}

let ctx = null;
let qrShot = null;
let qrPage = null;
let weatherCache = null;
export function homeCoords() {
  return { lat: process.env.HOME_LAT || '13.71', lon: process.env.HOME_LON || '100.41' };
}
export function nextHours(j, nowMs = Date.now(), n = 12, prev = 3) {
  const h = (j && j.hourly) || {};
  const bkk = (s) => {
    const m = /^(\d+)-(\d+)-(\d+)T(\d+):(\d+)/.exec(s || '');
    if (!m) return NaN;
    return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - 7 * 3600e3;
  };
  const times = h.time || [];
  let cur = times.length;
  for (let i = 0; i < times.length; i++) {
    const t = bkk(times[i]);
    if (!Number.isFinite(t)) continue;
    if (t <= nowMs && nowMs < t + 3600e3) { cur = i; break; }
    if (t > nowMs) { cur = i; break; }
  }
  const out = [];
  for (let i = Math.max(0, cur - prev); i < times.length && out.length < n; i++) {
    const t = bkk(times[i]);
    if (!Number.isFinite(t)) continue;
    out.push({
      t,
      tempC: h.temperature_2m ? h.temperature_2m[i] : null,
      code: h.weather_code ? h.weather_code[i] : null,
      precip: h.precipitation_probability ? h.precipitation_probability[i] : null,
      now: i === cur,
    });
  }
  return out;
}
export async function getWeather() {
  if (weatherCache && Date.now() - weatherCache.at < 10 * 60 * 1000) return weatherCache.data;
  const { lat, lon } = homeCoords();
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code,precipitation_probability&timezone=Asia%2FBangkok`);
  if (!r.ok) throw new Error('weather ' + r.status);
  const j = await r.json();
  const data = { tempC: j.current.temperature_2m, code: j.current.weather_code, at: Date.now(), hours: nextHours(j, Date.now(), 12) };
  weatherCache = { at: Date.now(), data };
  return data;
}

export function getQr() {
  return qrShot;
}

export function buildCookieHeader(cookies) {
  return (cookies || []).filter((c) => (c.domain || '').includes('tuya.ai')).map((c) => c.name + '=' + c.value).join('; ');
}

export function tuyaHeaders(incoming, sessionCookie) {
  const h = { ...(incoming || {}) };
  delete h.host;
  delete h['content-length'];
  delete h.connection;
  h.origin = 'https://us.device.tuya.ai';
  h.referer = 'https://us.device.tuya.ai/apps/2031674305368031282/';
  if (sessionCookie) h.cookie = sessionCookie;
  return h;
}

let sessionCookies = '';

export function setSessionCookies(s) {
  sessionCookies = s;
}

export function getSessionCookies() {
  return sessionCookies;
}

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GANG_FILE = () => process.env.GANG_NAMES_FILE || path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data/gang-names.json');

export function loadOverrides() {
  try {
    return JSON.parse(fs.readFileSync(GANG_FILE(), 'utf8'));
  } catch {
    return {};
  }
}

export function saveNames(id, names) {
  const f = GANG_FILE();
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const all = loadOverrides();
  all[id] = names.filter((n) => typeof n === 'string').map((n) => n.slice(0, 40));
  fs.writeFileSync(f, JSON.stringify(all));
  return all[id];
}

export function getNames(id) {
  const ov = loadOverrides()[id];
  if (Array.isArray(ov) && ov.length) return ov;
  return NAMES[id];
}

export async function getProps(devId) {
  await refreshSessionCookies();
  const r = await fetch('https://us.device.tuya.ai/open-api/v2.0/m/sdf/ss/devices/properties', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'micro-app-code': '@tuya-fe/smart2c-app-device',
      'micro-app-id': '2031674305368031282',
      'project-id': '69459073',
      'isolation-type': 'homeId',
      uid: 'az1650764274804vous3',
      cookie: sessionCookies
    },
    body: JSON.stringify({ device_ids: [devId] })
  });
  if (!r.ok) throw new Error('tuya ' + r.status);
  const j = await r.json();
  return (j.result || {})[devId] || [];
}

export async function tuyaLog(devId, hours = 24) {
  await refreshSessionCookies();
  const end = Date.now();
  const start = end - hours * 3600 * 1000;
  const params = new URLSearchParams({ dev_id: devId, start_time: String(start), end_time: String(end) });
  const r = await fetch('https://us.device.tuya.ai/open-api/v1.0/m/sdf/device/log/query?' + params, {
    headers: {
      'micro-app-code': '@tuya-fe/smart2c-app-device',
      'micro-app-id': '2031674305368031282',
      'project-id': '69459073',
      'isolation-type': 'homeId',
      uid: 'az1650764274804vous3',
      cookie: sessionCookies
    }
  });
  if (!r.ok) throw new Error('tuya ' + r.status);
  const j = await r.json();
  return (j.result && j.result.data) || [];
}

async function refreshSessionCookies() {
  try {
    const b = ctx && ctx.browser;
    if (!b) return sessionCookies;
    let all = [];
    if (typeof b.cookies === 'function') {
      all = await b.cookies();
    } else if (typeof b.contexts === 'function') {
      for (const c of b.contexts()) {
        try { all.push(...(await c.cookies())); } catch {}
      }
    }
    if (all.length) sessionCookies = buildCookieHeader(all);
  } catch {}
  return sessionCookies;
}

let lastError = null;
let lastErrorAt = 0;
export function getLastError() {
  return lastError ? { message: String(lastError).slice(0, 200), at: lastErrorAt } : null;
}
export async function refreshQr() {
  try {
    if (!qrPage) return null;
    if (!qrPage.url().includes('/login')) { qrShot = null; return null; }
    qrShot = await pageShot(qrPage);
    return qrShot;
  } catch {
    return null;
  }
}

async function pageShot(page) {
  for (const sel of ['div.qrcode', 'canvas']) {
    try {
      const el = page.locator(sel).first();
      if ((await el.count()) > 0) return await el.screenshot();
    } catch {}
  }
  try {
    const imgs = page.locator('img');
    const n = await imgs.count();
    for (let i = 0; i < Math.min(n, 10); i++) {
      const box = await imgs.nth(i).boundingBox();
      if (box && box.width > 100 && box.width < 400 && Math.abs(box.width - box.height) < 30) {
        return await imgs.nth(i).screenshot();
      }
    }
  } catch {}
  return await page.screenshot();
}

async function ensurePage() {
  if (ctx) return ctx.page;
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  ctx = { browser, page: await browser.newPage() };
  return ctx.page;
}

export async function pollOnce(profileDir) {
  const { chromium } = await import('playwright');
  if (!ctx) {
    const browser = await chromium.launchPersistentContext(profileDir, { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    ctx = { browser, page: browser.pages()[0] || await browser.newPage() };
  }
  const page = ctx.page;
  await page.goto('https://us.device.tuya.ai/apps/2031674305368031282/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await refreshSessionCookies();
  if (page.url().includes('/login')) {
    qrPage = page;
    qrShot = await pageShot(page);
    return { login: true };
  }
  qrShot = null;
  qrPage = null;
  let data;
  try {
    data = await page.evaluate(async () => {
    const H = { 'Content-Type': 'application/json;charset=UTF-8', 'micro-app-code': '@tuya-fe/smart2c-app-device', 'micro-app-id': '2031674305368031282', 'project-id': '69459073', 'isolation-type': 'homeId', uid: 'az1650764274804vous3' };
    const q = await fetch('/open-api/v1.0/m/sdf/device/pag/source-query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ project_id: '69459073', page_no: 1, page_size: 20 }) });
    const j = await q.json();
    const devices = (j.result.data || []).map((d) => ({ id: d.device_id, name: d.device_name, room: d.installation_location, online: d.device_status === 1 }));
    const props = {};
    for (const d of devices) {
      try {
        const r = await fetch('/open-api/v2.0/m/sdf/ss/devices/properties', { method: 'POST', headers: H, credentials: 'include', body: JSON.stringify({ device_ids: [d.id] }) });
        const jj = await r.json();
        props[d.id] = (jj.result || {})[d.id] || [];
      } catch (e) { props[d.id] = []; }
    }
    return { devices, props };
  });
  } catch (e) {
    lastError = e;
    lastErrorAt = Date.now();
    try {
      await new Promise((r) => setTimeout(r, 2000));
      if (page.url().includes('/login')) {
        qrPage = page;
        qrShot = await pageShot(page);
        lastError = null;
        return { login: true };
      }
    } catch {}
    throw e;
  }
  const gangsById = {};
  const powers = [];
  for (const d of data.devices) {
    const r = parseProps(d.id, data.props[d.id] || [], getNames(d.id));
    if (r.gangs) gangsById[d.id] = r.gangs;
    if (r.power) powers.push(r);
  }
  lastError = null;
  return mergeSnapshot(data.devices, gangsById, powers);
}

export { NAMES, METER, INV };
