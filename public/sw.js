/* ========================================================================
   CukaiSmart LHDN Tax Manager — Service Worker
   Recurring Push Notifications & 14-Day Deadline Alert System
   ======================================================================== */

const CACHE_NAME = 'cukaismart-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/icon.svg',
];

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// LHDN Official Filing Deadlines (Month-Day in current/next tax year)
const LHDN_DEADLINES = [
  { form: 'Form BE / e-BE', month: 4, day: 15, dateLabel: '15 May', type: 'Salaried Individual' },
  { form: 'Form B / e-B', month: 6, day: 15, dateLabel: '15 July', type: 'Sole Proprietorship / Freelance' },
  { form: 'Form E / e-E', month: 3, day: 30, dateLabel: '30 April', type: 'Employers' },
  { form: 'Form C / e-C', month: 7, day: 31, dateLabel: '31 August', type: 'Corporate Companies' },
];

// Helper: Calculate if current date is 14 days before any LHDN deadline
function check14DaysDeadlineAlerts() {
  const now = new Date();
  const currentYear = now.getFullYear();

  LHDN_DEADLINES.forEach((item) => {
    // Construct deadline date
    const deadlineDate = new Date(currentYear, item.month, item.day);
    if (deadlineDate < now) {
      deadlineDate.setFullYear(currentYear + 1);
    }

    // Target alert date = 14 days prior to deadline
    const alert14DaysPrior = new Date(deadlineDate.getTime() - 14 * 24 * 60 * 60 * 1000);

    // If today is on or within the 14-day alert window
    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 14 || (diffDays > 0 && diffDays <= 14)) {
      sendDeadlineNotification(item.form, item.dateLabel, diffDays);
    }
  });
}

// Function to dispatch native notification via Service Worker registration
function sendDeadlineNotification(formName, deadlineDateLabel, daysLeft) {
  const title = `LHDN Tax Deadline Alert: 14 Days Remaining!`;
  const body = `Official e-Filing for ${formName} is due on ${deadlineDateLabel}. You have ${daysLeft} days left to upload all proof receipts in CukaiSmart Vault.`;

  const options = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: `lhdn-14d-${formName}`,
    renotify: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: '/',
      deadline: deadlineDateLabel,
      formName,
      daysLeft,
      timestamp: Date.now(),
    },
    actions: [
      { action: 'open_vault', title: 'Open Vault' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  self.registration.showNotification(title, options);
}

// Handle Background Push Event
self.addEventListener('push', (event) => {
  let data = { title: 'LHDN Deadline Alert', body: '14 Days remaining before LHDN filing deadline!' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'lhdn-push-14d',
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Listen to Messages from React Client Application
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'TEST_14D_NOTIFICATION') {
    const { formName = 'Form BE (Salaried)', dateLabel = '15 May 2027' } = event.data;
    sendDeadlineNotification(formName, dateLabel, 14);
  }

  if (event.data.type === 'CHECK_DEADLINE_SCHEDULE') {
    check14DaysDeadlineAlerts();
  }
});
