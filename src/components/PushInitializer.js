'use client';

import { useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { subscribeUserToPush } from '../utils/push-notifications';

export default function PushInitializer() {
    useEffect(() => {
        // Register Service Worker
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    console.log("Service Worker registered with scope:", registration.scope);
                })
                .catch((error) => {
                    console.error("Service Worker registration failed:", error);
                });
        }

        // Setup push subscription if user is logged in
        const initPush = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                subscribeUserToPush();
            }
        };

        initPush();

        // Listen for login events to trigger permission prompt
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                    if (session) {
                        subscribeUserToPush();
                    }
                }
            }
        );

        return () => {
            authListener?.subscription?.unsubscribe();
        };
    }, []);

    return null;
}
