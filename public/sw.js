self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'schedule') return;
  const { title, body, timestamp } = data;

  const showNotification = () => {
    self.registration.showNotification(title, { body });
  };

  if ('showTrigger' in Notification.prototype && 'TimestampTrigger' in self) {
    self.registration.showNotification(title, {
      body,
      showTrigger: new TimestampTrigger(timestamp),
    });
  } else {
    const delay = timestamp - Date.now();
    setTimeout(showNotification, Math.max(0, delay));
  }
});
