import { useState, useEffect, useCallback } from 'react';

export interface LHDNPushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  swRegistration: ServiceWorkerRegistration | null;
  requestPermission: () => Promise<boolean>;
  toggleSubscription: () => Promise<void>;
  triggerTestPushNotification: (formName?: string, dateLabel?: string) => Promise<boolean>;
}

export function useLHDNPushNotifications(): LHDNPushNotificationState {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(() => {
    return localStorage.getItem('cukaismart_14d_push_enabled') === 'true';
  });
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Initialize Service Worker & Notification Permission check
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator;

    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);

      // Register custom sw.js
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          setSwRegistration(reg);

          // If previously subscribed, request service worker to check deadline schedule
          if (localStorage.getItem('cukaismart_14d_push_enabled') === 'true') {
            if (reg.active) {
              reg.active.postMessage({ type: 'CHECK_DEADLINE_SCHEDULE' });
            }
          }
        })
        .catch((err) => {
          console.warn('Service worker registration failed:', err);
        });
    }
  }, []);

  // Request Notification Permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        setIsSubscribed(true);
        localStorage.setItem('cukaismart_14d_push_enabled', 'true');

        // Send confirmation test via Service Worker
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'TEST_14D_NOTIFICATION',
            formName: 'Form BE (Salaried)',
            dateLabel: '15 May 2027',
          });
        } else if (swRegistration?.active) {
          swRegistration.active.postMessage({
            type: 'TEST_14D_NOTIFICATION',
            formName: 'Form BE (Salaried)',
            dateLabel: '15 May 2027',
          });
        }
        return true;
      } else {
        setIsSubscribed(false);
        localStorage.setItem('cukaismart_14d_push_enabled', 'false');
        return false;
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  }, [isSupported, swRegistration]);

  // Toggle Push Notification Preference
  const toggleSubscription = useCallback(async () => {
    if (isSubscribed) {
      setIsSubscribed(false);
      localStorage.setItem('cukaismart_14d_push_enabled', 'false');
    } else {
      await requestPermission();
    }
  }, [isSubscribed, requestPermission]);

  // Trigger Immediate Test Push Notification via Service Worker
  const triggerTestPushNotification = useCallback(
    async (formName = 'Form BE (Salaried)', dateLabel = '15 May 2027'): Promise<boolean> => {
      if (Notification.permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return false;
      }

      // Check if active service worker exists
      const targetWorker = navigator.serviceWorker.controller || swRegistration?.active;

      if (targetWorker) {
        targetWorker.postMessage({
          type: 'TEST_14D_NOTIFICATION',
          formName,
          dateLabel,
        });
        return true;
      } else {
        // Fallback to direct Notification constructor if SW postMessage isn't attached yet
        try {
          new Notification('LHDN Filing Deadline Alert: 14 Days Remaining!', {
            body: `Official e-Filing for ${formName} is due on ${dateLabel}. You have 14 days left to finalize all proof receipts in CukaiSmart Vault.`,
            icon: '/pwa-192x192.png',
            tag: 'lhdn-14d-test',
          });
          return true;
        } catch (err) {
          console.error('Failed to trigger notification fallback:', err);
          return false;
        }
      }
    },
    [requestPermission, swRegistration]
  );

  return {
    isSupported,
    permission,
    isSubscribed,
    swRegistration,
    requestPermission,
    toggleSubscription,
    triggerTestPushNotification,
  };
}
