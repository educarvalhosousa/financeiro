import { supabase } from './supabase';

/**
 * Requests permission for notifications and subscribes the user to push events.
 * Saving the push subscription to Supabase profiles table.
 */
export async function subscribeUserToPush() {
    try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push messaging is not supported in this browser.');
            return;
        }

        // Check current permission
        if (Notification.permission === 'denied') {
            console.warn('User has denied notification permissions.');
            return;
        }

        const registration = await navigator.serviceWorker.ready;

        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn('Notification permission was not granted.');
            return;
        }

        // Get or create subscription
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidKey) {
                console.error('VAPID public key not found in environment variables.');
                return;
            }

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            });
        }

        // Save to Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { error } = await supabase
                .from('profiles')
                .update({ push_token: subscription.toJSON() })
                .eq('id', user.id);

            if (error) {
                console.error('Error saving push token to Supabase:', error.message);
            } else {
                console.log('Push subscription saved successfully.');
            }
        }

    } catch (error) {
        console.error('Failed to subscribe user to push:', error);
    }
}

// Utility function to convert VAPID public key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
