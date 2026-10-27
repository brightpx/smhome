import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pollAll, getReal, getFile } from './tuyaWeb.js';
import { readHistory } from './history.js';
import { getQr, refreshQr } from './poller.js';

const FRONT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../frontend');
const DATA_HIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data/history');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };

export function startServer(port = 0) {
  const subs = [];
  let relay = null;
  const server = http.createServer((req, res) => {
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    if (req.method === 'OPTIONS') {
      res.writeHead(204, cors);
      res.end();
      return;
    }
    if (req.url === '/' ) req.url = '/index.html';
    if (req.method === 'GET' && ['/index.html', '/app.js', '/theme.css', '/manifest.json'].includes(req.url)) {
      try {
        const rel = req.url === '/theme.css' ? 'src/theme.css' : req.url.slice(1);
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
    if (req.url === '/api/history' && req.method === 'GET') {
      const body = JSON.stringify(readHistory(DATA_HIST));
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(body);
      return;
    }
    if (req.url === '/api/qr' && req.method === 'GET') {
      refreshQr().then((png) => {
        if (!png) { res.writeHead(404); res.end('no qr'); return; }
        res.writeHead(200, { 'Content-Type': 'image/png', 'Access-Control-Allow-Origin': '*' });
        res.end(png);
      }).catch(() => { res.writeHead(404); res.end('no qr'); });
      return;
    }
    if (req.url === '/api/status' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ loginNeeded: !!getQr() }));
      return;
    }
    if (req.url === '/api/devices' && req.method === 'GET') {
      const live = getReal() || getFile();
      const base = relay && Date.now() - relay.updatedAt < 120000 ? { onCount: (relay.devices || []).filter((d) => d.online).length, ...relay, source: relay.source || 'browser-relay' } : live || { ...pollAll(), source: 'mock' };
      const body = JSON.stringify(base);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(body);
      return;
    }
    if (req.url === '/api/ingest' && req.method === 'POST') {
      let data = '';
      req.on('data', (c) => (data += c));
      req.on('end', () => {
        try {
          relay = JSON.parse(data || '{}');
          relay.updatedAt = relay.updatedAt || Date.now();
        } catch {}
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true }));
      });
      return;
    }
    if (req.url === '/api/clientlog' && req.method === 'POST') {
      let data = '';
      req.on('data', (c) => (data += c));
      req.on('end', () => {
        try { fs.appendFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data/client.log'), new Date().toISOString() + ' ' + data.slice(0, 500) + '\n'); } catch {}
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true }));
      });
      return;
    }
    if (req.url === '/api/push/subscribe' && req.method === 'POST') {
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
    if (req.url === '/api/events') {
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
    res.writeHead(404);
    res.end('not found');
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const addr = server.address();
      resolve({
        url: `http://127.0.0.1:${addr.port}`,
        close: () => new Promise((r) => server.close(r))
      });
    });
  });
}
