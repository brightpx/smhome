import http from 'node:http';
import { pollAll } from './tuyaWeb.js';

export function startServer(port = 0) {
  const server = http.createServer((req, res) => {
    if (req.url === '/api/devices') {
      const body = JSON.stringify(pollAll());
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(body);
      return;
    }
    if (req.url === '/api/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      const payload = `data: ${JSON.stringify(pollAll())}\n\n`;
      res.write(payload);
      res.end();
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
