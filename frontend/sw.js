self.addEventListener('push', (e) => {
  let title = 'Smart Home';
  let body = 'มีการแจ้งเตือน';
  try {
    const d = e.data ? e.data.json() : null;
    if (d) { title = d.title || title; body = d.body || body; }
  } catch (_) {
    if (e.data) body = e.data.text();
  }
  e.waitUntil(self.registration.showNotification(title, { body, tag: 'smarthome-' + Date.now() }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});
