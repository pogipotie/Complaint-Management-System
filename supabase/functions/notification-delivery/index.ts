import { createClient } from 'npm:@supabase/supabase-js@2.110.6';
import webPush from 'npm:web-push@3.6.7';
import { allowedPushEndpoint, gmailMessage, notificationContent } from '../_shared/notification-content.ts';

const required = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

async function gmailToken(): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: required('GMAIL_CLIENT_ID'), client_secret: required('GMAIL_CLIENT_SECRET'),
      refresh_token: required('GMAIL_REFRESH_TOKEN'), grant_type: 'refresh_token'
    }),
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`Gmail authentication failed (${response.status})`);
  const data = await response.json();
  if (!data.access_token) throw new Error('Gmail authentication returned no token');
  return data.access_token;
}

export async function deliverNotifications(request: Request): Promise<Response> {
  // Cron only. Do not allow browser callers or a Supabase anon key to drain the queue.
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const secret = Deno.env.get('NOTIFICATION_WORKER_SECRET');
  if (!secret || request.headers.get('x-notification-secret') !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }
  const db = createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'));
  const { data: jobs, error } = await db.rpc('claim_notification_deliveries', { batch_size: 20 });
  if (error) return Response.json({ error: 'Unable to claim delivery queue' }, { status: 500 });
  let token: Promise<string> | undefined;
  const summary = { sent: 0, failed: 0, cancelled: 0 };
  for (const job of jobs || []) {
    try {
      const { data: event, error: eventError } = await db.from('notifications')
        .select('id,event_key,user_id,related_user_id,complaint_id').eq('id', job.notification_id).single();
      if (eventError || !event) throw new Error('Notification unavailable');
      const { data: recipient } = await db.from('users')
        .select('role,barangay,is_active,verification_status').eq('id', event.user_id).single();
      let eligible = !!recipient?.is_active;
      if (event.event_key === 'account_approved') {
        eligible &&= recipient?.role === 'citizen' && recipient?.verification_status === 'verified';
      } else {
        eligible &&= recipient?.role === 'brgy_captain' && recipient?.verification_status === 'verified';
        const sourceTable = event.event_key === 'citizen_registered' ? 'users' : 'complaints';
        const sourceId = event.event_key === 'citizen_registered' ? event.related_user_id : event.complaint_id;
        const { data: source } = await db.from(sourceTable).select('barangay').eq('id', sourceId).single();
        eligible &&= !!source && source.barangay === recipient?.barangay;
      }
      const finish = async (values: Record<string, unknown>) => {
        const result = await db.from('notification_deliveries').update(values)
          .eq('id', job.id).eq('lease_token', job.lease_token);
        if (result.error) throw new Error('Unable to record delivery result');
      };
      if (!eligible) {
        await finish({ status: 'cancelled', last_error: 'Recipient no longer eligible' });
        summary.cancelled++;
        continue;
      }
      const content = notificationContent(event, required('APP_URL'));
      let providerId: string | null = null;
      if (job.channel === 'email') {
        const { data: authData, error: authError } = await db.auth.admin.getUserById(event.user_id);
        if (authError || !authData.user?.email || !authData.user.email_confirmed_at) {
          await finish({ status: 'cancelled', last_error: 'Recipient email is not confirmed' });
          summary.cancelled++;
          continue;
        }
        token ??= gmailToken();
        const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST', headers: { Authorization: `Bearer ${await token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw: gmailMessage(required('GMAIL_SENDER_EMAIL'), authData.user.email,
            content.title, `${content.body}\n\n${content.url}\n\nMunicipal Complaint Management System`, job.id) }),
          signal: AbortSignal.timeout(15000)
        });
        if (!response.ok) throw new Error(`Gmail send failed (${response.status})`);
        providerId = (await response.json()).id;
      } else {
        const { data: subscription } = await db.from('push_subscriptions')
          .select('*').eq('id', job.subscription_id).eq('user_id', event.user_id).single();
        if (!subscription || !allowedPushEndpoint(subscription.endpoint)) {
          await finish({ status: 'cancelled', last_error: 'Push device unavailable or unsupported' });
          summary.cancelled++;
          continue;
        }
        try {
          await webPush.sendNotification({
            endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth }
          }, JSON.stringify({ ...content, id: event.id }), {
            vapidDetails: { subject: required('VAPID_SUBJECT'), publicKey: required('VAPID_PUBLIC_KEY'),
              privateKey: required('VAPID_PRIVATE_KEY') },
            TTL: 3600, timeout: 15000
          });
        } catch (error) {
          if ([404, 410].includes((error as { statusCode?: number }).statusCode || 0)) {
            const result = await db.from('push_subscriptions').delete().eq('id', subscription.id);
            if (result.error) throw new Error('Unable to remove expired push device');
            summary.cancelled++;
            continue;
          }
          throw new Error(`Push delivery failed (${(error as { statusCode?: number }).statusCode || 'network'})`);
        }
      }
      await finish({ status: 'sent', sent_at: new Date().toISOString(), provider_id: providerId, last_error: null });
      if (job.channel === 'email') {
        await db.from('notifications').update({ emailed_at: new Date().toISOString() }).eq('id', event.id);
      }
      summary.sent++;
    } catch (error) {
      // Only sanitized errors reach the queue; do not log tokens, endpoints, or provider response bodies.
      const message = error instanceof Error ? error.message : 'Delivery failed';
      await db.from('notification_deliveries').update({
        status: job.attempts >= 5 ? 'failed' : 'pending',
        available_at: new Date(Date.now() + Math.min(3600, 60 * 2 ** job.attempts) * 1000).toISOString(),
        last_error: message.slice(0, 200)
      }).eq('id', job.id).eq('lease_token', job.lease_token);
      summary.failed++;
    }
  }
  return Response.json(summary);
}

if (import.meta.main) Deno.serve(deliverNotifications);
