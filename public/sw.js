self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push Received.');
    console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'Nova Notificação', body: event.data.text() };
        }
    }

    const title = data.title || 'FinanSe Pro';
    const options = {
        body: data.body || 'Você tem uma nova atualização financeira.',
        icon: '/logo6.png',
        badge: '/logo6.png',
        data: data.url || '/'
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
    console.log('[Service Worker] Notification click Received.');

    event.notification.close();

    event.waitUntil(
        clients.openWindow(event.notification.data)
    );
});
