export interface NotificationEvent {
  id: string;
  event_key: string;
  user_id: string;
  related_user_id?: string | null;
  complaint_id?: string | null;
}

export function notificationContent(event: NotificationEvent, appUrl: string) {
  const origin = new URL(appUrl);
  if (origin.protocol !== 'https:' && origin.hostname !== 'localhost') {
    throw new Error('APP_URL must use HTTPS.');
  }
  let title: string;
  let body: string;
  let route: string;
  switch (event.event_key) {
    case 'account_approved':
      title = 'Account Approved';
      body = 'Your account has been approved. You can now submit a complaint.';
      route = '/citizen/complaints/new';
      break;
    case 'citizen_registered':
      title = 'Citizen Account Requires Approval';
      body = 'A citizen in your barangay requires account approval. Sign in to review their registration.';
      route = `/captain/users?citizen=${encodeURIComponent(event.related_user_id || '')}`;
      break;
    case 'complaint_submitted':
      title = 'New Complaint in Your Barangay';
      body = 'A citizen submitted a complaint in your barangay. Sign in to review the complaint.';
      route = '/captain/complaints';
      break;
    default:
      throw new Error('Unsupported notification event.');
  }
  return { title, body, url: new URL(route, origin).href };
}

export function allowedPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port &&
      /^(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-zA-Z0-9.-]+\.notify\.windows\.com|web\.push\.apple\.com)$/.test(url.hostname);
  } catch {
    return false;
  }
}

export function gmailMessage(sender: string, recipient: string, title: string, body: string, id: string) {
  const email = /^[^\s<>@\r\n]+@[^\s<>@\r\n]+\.[^\s<>@\r\n]+$/;
  if (!email.test(sender) || !email.test(recipient) || /[\r\n]/.test(title)) {
    throw new Error('Invalid email address or subject.');
  }
  const encode = (value: string) => btoa(String.fromCharCode(...new TextEncoder().encode(value)));
  const mime = [
    `From: ${sender}`, `To: ${recipient}`, `Subject: ${title}`,
    `Message-ID: <crms-${id}@${sender.split('@')[1]}>`,
    'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64', '', encode(body)
  ].join('\r\n');
  return encode(mime).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
