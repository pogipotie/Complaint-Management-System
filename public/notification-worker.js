self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let content;
  try {
    content = event.data?.json();
  } catch {
    content = null;
  }
  if (!content) return;
  event.waitUntil(self.registration.showNotification(content.title || 'Municipal CRMS', {
    body: content.body || 'Sign in to review your latest notification.',
    tag: content.id, icon: '/app-icon.svg',
    data: { url: content.url }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/captain/dashboard', self.location.origin);
  if (target.origin !== self.location.origin) return;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin === target.origin) {
        await client.navigate(target.href);
        return client.focus();
      }
    }
    return self.clients.openWindow(target.href);
  })());
});
