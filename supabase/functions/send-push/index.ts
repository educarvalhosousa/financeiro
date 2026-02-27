import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import webpush from "npm:web-push@3.6.7";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        // VAPID keys should be set in Supabase Edge Function secrets
        const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

        webpush.setVapidDetails(
            'mailto:seu-email@dominio.com',
            vapidPublicKey,
            vapidPrivateKey
        );

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { record, userId, title, body, data } = await req.json();

        // The user ID we want to send the notification to
        const targetUserId = userId || record?.user_id;

        if (!targetUserId) {
            throw new Error("Target user ID not provided or inferred.");
        }

        // Get the user's push_token from profiles table
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('push_token')
            .eq('id', targetUserId)
            .single();

        if (profileError || !profileData?.push_token) {
            return new Response(JSON.stringify({ message: "User has no push token registered.", error: profileError }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200, // Returning 200 to not fail webhooks unnecessarily, just skip
            });
        }

        const pushSubscription = profileData.push_token;

        const payload = JSON.stringify({
            title: title || 'Nova Notificação',
            body: body || 'Mensagem do sistema',
            data: data || '/'
        });

        const pushResult = await webpush.sendNotification(pushSubscription, payload);

        return new Response(JSON.stringify({ success: true, pushResult }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
