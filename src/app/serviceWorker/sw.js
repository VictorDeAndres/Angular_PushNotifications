'use strict';

self.addEventListener('push', function(event) {
  const title = 'Comunicacion Angular Web Push Notification';
  const options = {
    body: event.data.text(),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});