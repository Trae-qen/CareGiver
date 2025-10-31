/* eslint-disable no-restricted-globals */

// This is the simplest possible service worker.
// It exists to be registered so we can use the Push API.

// 'self' refers to the service worker itself
self.addEventListener('push', (event) => {
  // We'll get the data from the push event
  const data = event.data?.json() || { title: 'New Notification', body: 'You have an update.' };
  
  const title = data.title;
  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
  };

  // This tells the browser to show the notification
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// This just makes sure the new service worker activates
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});