import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pollAll, getReal, getFile, enrichDevices, registry } from './tuyaWeb.js';
import { readHistory } from './history.js';
import { getQr, refreshQr, tuyaHeaders, getSessionCookies, tuyaLog, getProps } from './poller.js';
import { diffSnapshots } from './changes.js';

const FRONT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../frontend');
const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data');
const DATA_HIST = path.join(DATA_DIR, 'history');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };

export function startServer(port = 0, host = '127.0.0.1') {
  const subs = [];
  let relay = null;
  const server = http.createServer((req, res) => {
    let lastPersist = 0;
    const DEVLOG = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data/device-log.jsonl');
    const appendEvents = (events) => {
      if (!events.length) return;
      try {
        fs.mkdirSync(path.dirname(DEVLOG), { recursive: true });
        fs.appendFileSync(DEVLOG, events.map((e) => JSON.stringify(e)).join('\n') + '\n');
        const lines = fs.readFileSync(DEVLOG, 'utf8').trim().split('\n');
        if (lines.length > 2000) fs.writeFileSync(DEVLOG, lines.slice(-2000).join('\n') + '\n');
      } catch {}
    };
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    let pathname = req.url.split('?')[0];
    if (pathname === '/') pathname = '/index.html';
    if (req.method === 'OPTIONS') {
      res.writeHead(204, cors);
      res.end();
      return;
    }
    if (pathname === '/') pathname = '/index.html';
    if (req.method === 'GET' && ['/index.html', '/app.js', '/theme.css', '/manifest.json'].includes(pathname)) {
      try {
        const rel = pathname === '/theme.css' ? 'src/theme.css' : pathname.slice(1);
        const file = path.join(FRONT, rel);
        const data = fs.readFileSync(file);
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
        res.end(data);
        return;
      } catch {
        res.writeHead(404);
        res.end('not found');
        return;
      }
    }
    if (pathname === '/api/devicelog' && req.method === 'GET') {
      try {
        const u = new URL(req.url, 'http://x');
        const id = u.searchParams.get('dev_id');
        const raw = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data/device-log.jsonl'), 'utf8').trim();
        const rows = raw ? raw.split('\n').map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : [];
        const out = (id ? rows.filter((e) => e.device_id === id) : rows).slice(-50).reverse();
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(out));
      } catch {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end('[]');
      }
      return;
    }
    if (pathname === '/api/rawprops' && req.method === 'GET') {
      const u = new URL(req.url, 'http://x');
      getProps(u.searchParams.get('dev_id') || '').then((arr) => {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(arr));
      }).catch(() => {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: 'tuya-props-unavailable' }));
      });
      return;
    }
    if (pathname === '/api/tuyalog' && req.method === 'GET') {
      const u = new URL(req.url, 'http://x');
      tuyaLog(u.searchParams.get('dev_id') || '', Number(u.searchParams.get('hours') || 24)).then((rows) => {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify((rows || []).slice(0, 50)));
      }).catch(() => {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: 'tuya-log-unavailable' }));
      });
      return;
    }
    if (pathname === '/api/history' && req.method === 'GET') {
      const body = JSON.stringify(readHistory(DATA_HIST));
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(body);
      return;
    }
    if (pathname === '/api/qr' && req.method === 'GET') {
      refreshQr().then((png) => {
        if (!png) { res.writeHead(404); res.end('no qr'); return; }
        res.writeHead(200, { 'Content-Type': 'image/png', 'Access-Control-Allow-Origin': '*' });
        res.end(png);
      }).catch(() => { res.writeHead(404); res.end('no qr'); });
      return;
    }
    if (pathname === '/api/status' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ loginNeeded: !!getQr() }));
      return;
    }
    if (pathname === '/api/devices' && req.method === 'GET') {
      const live = getReal() || getFile();
      const rel = relay && Date.now() - relay.updatedAt < 120000 ? { ...relay, devices: enrichDevices(relay.devices, registry()), source: relay.source || 'browser-relay' } : null;
      const base = rel || live || { ...pollAll(), source: 'mock' };
      if (rel) base.onCount = (base.devices || []).filter((d) => d.online).length;
      const body = JSON.stringify(base);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(body);
      return;
    }
    if (pathname === '/api/ingest' && req.method === 'POST') {
      let data = '';
      req.on('data', (c) => (data += c));
      req.on('end', () => {
        try {
          const incoming = JSON.parse(data || '{}');
          incoming.updatedAt = incoming.updatedAt || Date.now();
          if (incoming.devices) {
            incoming.devices = enrichDevices(incoming.devices, registry());
            if (relay && relay.devices) appendEvents(diffSnapshots(relay, incoming));
            relay = incoming;
            if (Date.now() - lastPersist > 60000 && (relay.source === 'auto-poller' || relay.source === 'browser-relay')) {
              lastPersist = Date.now();
              try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(path.join(DATA_DIR, 'live.json'), JSON.stringify(relay)); } catch {}
            }
          } else {
            relay = incoming;
          }
        } catch {}
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true }));
      });
      return;
    }
    if (pathname === '/api/clientlog' && req.method === 'POST') {
      let data = '';
      req.on('data', (c) => (data += c));
      req.on('end', () => {
        try { fs.appendFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data/client.log'), new Date().toISOString() + ' ' + data.slice(0, 500) + '\n'); } catch {}
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true }));
      });
      return;
    }
    if (pathname === '/api/push/subscribe' && req.method === 'POST') {
      let data = '';
      req.on('data', (c) => (data += c));
      req.on('end', () => {
        try {
          subs.push(JSON.parse(data || '{}'));
        } catch {}
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, count: subs.length }));
      });
      return;
    }
    if (pathname === '/api/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.write('retry: 5000\n\n');
      const timer = setInterval(() => {
        try {
          res.write(`data: ${JSON.stringify(pollAll())}\n\n`);
        } catch {}
      }, 5000);
      req.on('close', () => clearInterval(timer));
      return;
    }
    if (pathname.startsWith('/apps/') || pathname.startsWith('/open-api/') || pathname.startsWith('/api/')) {
      (async () => {
        try {
          const chunks = [];
          for await (const c of req) chunks.push(c);
          const q = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
          const r = await fetch('https://us.device.tuya.ai' + pathname + q, {
            method: req.method,
            headers: tuyaHeaders(req.headers, getSessionCookies()),
            body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks)
          });
          const buf = Buffer.from(await r.arrayBuffer());
          res.writeHead(r.status, { 'Content-Type': r.headers.get('content-type') || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
          res.end(buf);
        } catch (e) {
          res.writeHead(502);
          res.end('proxy error');
        }
      })();
      return;
    }
    res.writeHead(404);
    res.end('not found');
  });
  return new Promise((resolve) => {
    server.listen(port, host, () => {
      const addr = server.address();
      const shown = host === '0.0.0.0' ? 'localhost' : host;
      resolve({
        url: `http://${shown}:${addr.port}`,
        close: () => new Promise((r) => server.close(r))
      });
    });
  });
}
