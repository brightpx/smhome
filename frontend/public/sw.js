self.addEventListener('push', (e) => {
  const data = e.data ? e.data.text() : 'Smart Home แจ้งเตือน';
  e.waitUntil(self.registration.showNotification('Smart Home', { body: data }));
});
