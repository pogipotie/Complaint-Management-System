import { deliverNotifications } from './index.ts';
import webPush from 'npm:web-push@3.6.7';

function assert(value: boolean, message: string) {
  if (!value) throw new Error(message);
}

for (const outcome of ['success', 'gmail-failure', 'wrong-barangay', 'unconfirmed-email', 'unauthorized',
  'push-success', 'push-expired', 'push-failure']) {
  Deno.test(`Delivery worker: ${outcome}`, async () => {
    const originalFetch = globalThis.fetch;
    const originalPush = webPush.sendNotification;
    const env = {
      SUPABASE_URL: 'https://supabase.example', SUPABASE_SERVICE_ROLE_KEY: 'test-service',
      NOTIFICATION_WORKER_SECRET: 'test-worker', APP_URL: 'https://municipality.example',
      GMAIL_CLIENT_ID: 'test-id', GMAIL_CLIENT_SECRET: 'test-secret',
      GMAIL_REFRESH_TOKEN: 'test-refresh', GMAIL_SENDER_EMAIL: 'municipality@gmail.com',
      VAPID_PUBLIC_KEY: 'test-public', VAPID_PRIVATE_KEY: 'test-private', VAPID_SUBJECT: 'mailto:municipality@gmail.com'
    };
    const previous = Object.fromEntries(Object.keys(env).map(key => [key, Deno.env.get(key)]));
    for (const [key, value] of Object.entries(env)) Deno.env.set(key, value);
    const patches: Record<string, unknown>[] = [];
    let gmailSends = 0;
    let calls = 0;
    let pushSends = 0;
    let removedDevice = false;
    const captainId = '00000000-0000-4000-8000-000000000001';
    webPush.sendNotification = async () => {
      pushSends++;
      if (outcome === 'push-expired') throw Object.assign(new Error('expired'), { statusCode: 410 });
      if (outcome === 'push-failure') throw Object.assign(new Error('unavailable'), { statusCode: 503 });
      return { statusCode: 201, body: '', headers: {} };
    };
    globalThis.fetch = async (input, options) => {
      calls++;
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
      const json = (data: unknown, status = 200) => Promise.resolve(Response.json(data, { status }));
      if (url.pathname.endsWith('/rpc/claim_notification_deliveries')) {
        return json([{ id: 'job', notification_id: 'note', channel: outcome.startsWith('push-') ? 'push' : 'email',
          subscription_id: 'device', attempts: 1, lease_token: 'lease' }]);
      }
      if (url.pathname.endsWith('/notifications')) {
        if (options?.method === 'PATCH') return new Response(null, { status: 204 });
        return json({ id: 'note', user_id: captainId, event_key: 'citizen_registered', related_user_id: 'citizen' });
      }
      if (url.pathname.endsWith('/users') && url.hostname === 'supabase.example') {
        return json(url.searchParams.get('id') === `eq.${captainId}`
          ? { role: 'brgy_captain', is_active: true, verification_status: 'verified', barangay: 'A' }
          : { barangay: outcome === 'wrong-barangay' ? 'B' : 'A' });
      }
      if (url.pathname === `/auth/v1/admin/users/${captainId}`) {
        return json({ id: captainId, email: 'captain@gmail.com',
          email_confirmed_at: outcome === 'unconfirmed-email' ? null : '2026-01-01' });
      }
      if (url.hostname === 'oauth2.googleapis.com') return json({ access_token: 'test-token' });
      if (url.hostname === 'gmail.googleapis.com') {
        gmailSends++;
        return json({ id: 'gmail-message' }, outcome === 'gmail-failure' ? 429 : 200);
      }
      if (url.pathname.endsWith('/push_subscriptions')) {
        if (options?.method === 'DELETE') {
          removedDevice = true;
          return new Response(null, { status: 204 });
        }
        return json({ id: 'device', user_id: captainId,
          endpoint: 'https://fcm.googleapis.com/fcm/send/test', p256dh: 'test-key', auth: 'test-auth' });
      }
      if (url.pathname.endsWith('/notification_deliveries')) {
        patches.push(JSON.parse(String(options?.body)));
        return new Response(null, { status: 204 });
      }
      throw new Error(`Unexpected test request: ${url.pathname}`);
    };
    try {
      const response = await deliverNotifications(new Request('https://worker.example', {
        method: 'POST', headers: { 'x-notification-secret': outcome === 'unauthorized' ? 'wrong' : 'test-worker' }
      }));
      if (outcome === 'unauthorized') {
        assert(response.status === 401 && calls === 0, 'Unauthorized caller cannot claim jobs');
      } else if (outcome === 'push-success') {
        assert(pushSends === 1 && gmailSends === 0 && patches[0]?.status === 'sent', 'Push delivery succeeds independently');
      } else if (outcome === 'push-expired') {
        assert(pushSends === 1 && removedDevice, 'Expired device removed');
        assert((await response.json()).cancelled === 1, 'Expired delivery counted as cancelled');
      } else if (outcome === 'push-failure') {
        assert(pushSends === 1 && patches[0]?.status === 'pending', 'Push failure retries');
      } else if (outcome === 'wrong-barangay' || outcome === 'unconfirmed-email') {
        assert(gmailSends === 0 && patches[0]?.status === 'cancelled', `Ineligible delivery cancelled: ${JSON.stringify(patches)}`);
      } else if (outcome === 'gmail-failure') {
        assert(gmailSends === 1 && patches[0]?.status === 'pending', `Gmail failure queued for retry: ${JSON.stringify(patches)}`);
        assert(String(patches[0]?.last_error).includes('429'), 'Sanitized failure recorded');
      } else {
        assert(gmailSends === 1 && patches[0]?.status === 'sent', `Email sent and queue marked sent: ${JSON.stringify(patches)}`);
        assert(patches[0]?.provider_id === 'gmail-message', 'Provider identifier recorded');
      }
    } finally {
      globalThis.fetch = originalFetch;
      webPush.sendNotification = originalPush;
      for (const key of Object.keys(env)) {
        if (previous[key] === undefined) Deno.env.delete(key);
        else Deno.env.set(key, previous[key]!);
      }
    }
  });
}
