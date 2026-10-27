import http from 'node:http';
import { pollAll, getReal, getFile } from './tuyaWeb.js';

export function startServer(port = 0) {
  const subs = [];
  let relay = null;
  const server = http.createServer((req, res) => {
    if (req.url === '/api/devices' && req.method === 'GET') {
      const live = getReal() || getFile();
      const base = relay && Date.now() - relay.updatedAt < 30000 ? { ...relay, source: 'browser-relay' } : live || { ...pollAll(), source: 'mock' };
      const body = JSON.stringify(base);
      res.writeHead(200, { 'Content-Type': 'application/json' });
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
        res.writeHead(200, { 'Content-Type': 'application/json' });
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
