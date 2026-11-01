import { allowedPushEndpoint, gmailMessage, notificationContent } from './notification-content.ts';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

Deno.test('Approval email contains required wording and citizen route', () => {
  const content = notificationContent({ id: 'n', user_id: 'u', event_key: 'account_approved' }, 'https://municipality.example');
  assert(content.body === 'Your account has been approved. You can now submit a complaint.', 'Approval wording');
  assert(content.url === 'https://municipality.example/citizen/complaints/new', 'Citizen route');
});

Deno.test('Captain alerts contain no citizen name, evidence, or complaint description', () => {
  const content = notificationContent({ id: 'n', user_id: 'u', event_key: 'citizen_registered', related_user_id: 'id&evil=1' }, 'https://municipality.example');
  assert(content.url.endsWith('citizen=id%26evil%3D1'), 'Encoded registration identifier');
  assert(!content.body.includes('id&evil'), 'No identifying data in body');
});

Deno.test('Only known HTTPS push providers are allowed', () => {
  for (const url of ['https://fcm.googleapis.com/fcm/send/key', 'https://web.push.apple.com/key',
    'https://updates.push.services.mozilla.com/wpush/v2/key', 'https://wns.notify.windows.com/key']) {
    assert(allowedPushEndpoint(url), url);
  }
  for (const url of ['http://fcm.googleapis.com/x', 'https://127.0.0.1/x',
    'https://fcm.googleapis.com.evil.example/x', 'https://fcm.googleapis.com:444/x',
    'https://user:password@fcm.googleapis.com/x']) {
    assert(!allowedPushEndpoint(url), url);
  }
});

Deno.test('Gmail MIME is encoded and rejects header injection', () => {
  const raw = gmailMessage('municipality@gmail.com', 'citizen@gmail.com', 'Account Approved', 'Your account has been approved.', 'job-id');
  const decoded = atob(raw.replace(/-/g, '+').replace(/_/g, '/'));
  assert(decoded.includes('To: citizen@gmail.com\r\n'), 'Correct recipient');
  assert(decoded.includes('Message-ID: <crms-job-id@gmail.com>'), 'Stable message identifier');
  let rejected = false;
  try { gmailMessage('municipality@gmail.com', 'citizen@gmail.com\r\nBcc: other@example.com', 'Approval', '', 'id'); }
  catch { rejected = true; }
  assert(rejected, 'Header injection rejected');
});
