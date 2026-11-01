# Account Approval, Gmail and Mobile Notifications

## What Is Implemented

- Citizens register as Pending. Only approved, active citizens can submit complaints, including through direct API requests.
- Active, approved captains may approve citizens only within their assigned barangay. Admin/staff review access is retained.
- Approval time and reviewer are recorded. Citizens cannot self-approve or change their own role.
- Account approval queues the exact email: "Your account has been approved. You can now submit a complaint."
- New registrations, resubmissions, and complaint submissions queue emails and opt-in mobile push for matching active, approved captains only.
- Existing in-app notifications continue through Supabase Realtime.
- The new external-delivery worker handles these three event categories only. Existing escalation, status, ban and announcement notices retain their in-app behavior; a legacy `should_email` flag alone still does not enqueue them.
- Bell lists reset on account changes and ignore late responses from the previous session.
- The worker rechecks account and barangay eligibility before delivery, retries transient failures, and removes expired push devices.
- Queue uniqueness and leases prevent normal duplicate/concurrent processing. Delivery is at-least-once: Gmail has no send idempotency key, so a crash after provider acceptance can cause a duplicate on retry. A stable Message-ID is included, but does not guarantee Gmail deduplication.

This feature is NOT activated by a database migration alone. Complete the following deployment steps.

## 1. Apply the Migration

Verify the Supabase project reference before running:

`supabase/migrations/20261102010000_account_approval_notifications.sql`

The resolution timestamp migration is separate. Neither migration is applied automatically by the frontend.
Historical notifications are intentionally not emailed retroactively.

## 2. Authorize the Municipality Gmail Account

Use Google OAuth, not the Gmail password:

Only the municipality sender authorizes Google access. Citizens do not connect their Gmail accounts.

### A. Create the Google Project

1. Open https://console.cloud.google.com/ using an authorized municipal administrator account.
2. Select the project menu, then **New Project**. Name it `Municipal CRMS Notifications`.
3. Select that project. Open **APIs & Services > Library**, find **Gmail API**, and select **Enable**.
4. Open **Google Auth Platform** (or **APIs & Services > OAuth consent screen**).
5. Under **Branding/Get started**, enter the app name, support email, and developer contact email.
6. Choose **External** for a normal `@gmail.com` sender. Choose **Internal** only if the project belongs to a Google Workspace organization and the sender is in that organization.
7. While the External app is in Testing, add only the municipality sender under **Audience > Test users**. Citizens are not test users.
8. Under **Data Access > Add or remove scopes**, add only `https://www.googleapis.com/auth/gmail.send`. Do not request inbox-read, full mailbox, or Gmail login scopes.

### B. Create the OAuth Client

1. Open **Google Auth Platform > Clients > Create client** (older UI: **APIs & Services > Credentials > Create Credentials > OAuth client ID**).
2. Select **Web application**, naming it `Municipal CRMS Gmail Sender`.
3. Under **Authorized redirect URIs**, add exactly:

   `https://developers.google.com/oauthplayground`

4. Authorized JavaScript origins are not needed for this server-side Playground setup.
5. Create the client and store its **Client ID** and **Client secret** in a password manager. These become `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET`.

This redirect is for one-time sender authorization, not citizen login. Do not use Supabase's login callback here.

### C. Obtain the Sender Refresh Token

1. Open https://developers.google.com/oauthplayground in a browser session where you can select the municipality sender.
2. Open the settings gear and check **Use your own OAuth credentials**.
3. Enter the client ID and client secret from your project.
4. Set **OAuth flow: Server-side**, **Access type: Offline**, and **Force prompt: Consent Screen**.
5. Close settings. In Step 1, enter `https://www.googleapis.com/auth/gmail.send`, then **Authorize APIs**.
6. Select the municipality Gmail account and approve the send-email permission. If Google blocks authorization, check the test-user list and Workspace administrator restrictions. Do not bypass an organizational restriction.
7. In Step 2, select **Exchange authorization code for tokens**.
8. Store the **Refresh token** as `GMAIL_REFRESH_TOKEN`. Do not use the short-lived Access token as this secret.
9. Set `GMAIL_SENDER_EMAIL` to the exact account you authorized, or a Gmail-configured send-as alias.
10. Do not generate or share a Playground link containing credentials/tokens.

The worker automatically exchanges the refresh token for fresh access tokens. It does not need a Gmail password or App Password.

### D. Make Authorization Suitable for Production

For an External OAuth app in **Testing**, this Gmail-scope refresh token normally expires after **seven days**.
Before live use, review **Audience > Publish app** and Google's production/verification requirements.
Publishing and verification are separate: publishing does not automatically verify the app.
Provide accurate homepage/privacy-policy details when required; do not invent public URLs for the existing in-app legal dialogs.
After moving to Production, authorize the sender again and replace any token obtained during Testing.
Google verification or Workspace administrator approval may still be required.
Even production tokens can be revoked, expire through inactivity or policy, or stop working after a Gmail-related password change.

### Common OAuth Errors

| Error | Check |
|---|---|
| `redirect_uri_mismatch` | Exact Playground redirect URI on the correct Web Application client |
| `access_denied` / access blocked | Correct sender in Test users; organizational policy permits access |
| No refresh token | Offline access, forced consent, own OAuth credentials; reauthorize |
| `invalid_grant` / worker authentication failure | Expired Testing token, revoked access, password/policy change; reauthorize |
| `invalid_client` | Client ID and secret must belong to the same Google project/client |
| Gmail send failure `403` | Gmail API enabled, `gmail.send` granted, sender authorized, account policy/quota |
| Gmail send failure `429` | Sending/rate limits; inspect queue and avoid rapid manual retries |

Do not paste credentials into this repository, frontend environment files, logs, or chat.
Gmail quotas and Google anti-abuse restrictions still apply. Monitor failures; email is not guaranteed instantaneous delivery.

## 3. Configure Server Secrets

Set these in Supabase Edge Function secrets, using a protected local secrets file or dashboard:

| Secret | Purpose |
|---|---|
| `APP_URL` | Exact public HTTPS origin, without a trailing slash |
| `GMAIL_CLIENT_ID` | Google OAuth client ID |
| `GMAIL_CLIENT_SECRET` | Google OAuth client secret |
| `GMAIL_REFRESH_TOKEN` | Municipality account's offline token |
| `GMAIL_SENDER_EMAIL` | Authorized municipality Gmail sender |
| `NOTIFICATION_WORKER_SECRET` | Random 32-byte or longer secret for cron authorization |
| `VAPID_PUBLIC_KEY` | Web Push public key |
| `VAPID_PRIVATE_KEY` | Web Push private key |
| `VAPID_SUBJECT` | `mailto:` municipality contact address |

Generate VAPID keys using a trusted Web Push tool, for example `npx web-push generate-vapid-keys`.
Keep the private key stable. Rotating it requires devices to disable and re-enable notifications.
Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

### Generate and Store the Non-Google Keys

Run these locally in PowerShell; they print secret material, so do not share the terminal output:

```powershell
npx --yes web-push@3.6.7 generate-vapid-keys
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

The first command produces `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`.
The second produces `NOTIFICATION_WORKER_SECRET`. These are unrelated to Google OAuth.
Set `VAPID_SUBJECT` to `mailto:your-municipality-sender@gmail.com`.
Set `APP_URL` to the deployed frontend's exact HTTPS origin, not the Supabase URL, with no trailing slash.

In the Supabase dashboard, open the correct project, then **Edge Functions > Secrets**.
Add all nine secrets from the table above. Do not store them under **Authentication > Providers > Google**:
that screen configures Google sign-in, not this Gmail sender.
Use plain values without surrounding quotes.
Keep a protected backup of the credentials; do not commit a populated secrets file.

## 4. Deploy Functions

```powershell
supabase functions deploy notification-delivery --no-verify-jwt
supabase functions deploy push-config --no-verify-jwt
```

JWT gateway verification is disabled intentionally: the delivery worker authenticates a separate cron secret, while `push-config` validates the caller with Supabase Auth and checks their captain profile itself.
Never expose the worker secret or service-role key to the browser.

## 5. Schedule Delivery

Enable `pg_cron`, `pg_net`, and Vault in the correct hosted Supabase project.
Store `notification_worker_url` and `notification_worker_secret` in Vault using the dashboard.
The URL is `https://<project-ref>.supabase.co/functions/v1/notification-delivery`.

Run the following once in SQL Editor; check existing jobs before scheduling:

```sql
select cron.schedule('municipal-notification-delivery', '* * * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='notification_worker_url' limit 1),
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-notification-secret',
      (select decrypted_secret from vault.decrypted_secrets where name='notification_worker_secret' limit 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
$$);
```

The worker claims up to 20 deliveries per invocation. Busy installations need capacity planning and Gmail quota review.
Retries back off, with five attempts maximum. Stale leases expire after ten minutes.
In-app alerts are real-time; email/push are near-real-time (normally the next cron run plus provider delivery time).
Do not run overlapping external cron schedules unnecessarily.

Inspect restricted delivery logs:

```sql
select channel,status,count(*) from public.notification_deliveries group by channel,status;
select id,channel,attempts,last_error from public.notification_deliveries where status='failed';
```

After correcting configuration, retry selected failed IDs only:

```sql
update public.notification_deliveries
set status='pending',attempts=0,available_at=now(),locked_at=null,lease_token=null,last_error=null
where id='<reviewed-delivery-id>' and status='failed';
```

Do not bulk-replay sent records. Establish a retention policy for old sent/cancelled delivery records.

## 6. Deploy and Enable Mobile Alerts

- Deploy the frontend over HTTPS, serving `/notification-worker.js`, `/manifest.webmanifest`, and `/app-icon.svg` as static files with correct content types.
- Do not cache the service worker indefinitely or rewrite its request to `index.html`.
- Captains open the bell menu and select **Enable Mobile Notifications** on each device.
- Android requires a supported browser and notification permission.
- On supported iPhones/iPads (iOS/iPadOS 16.4+), add the website to the Home Screen, launch it there, and grant notification permission.
- This is Web Push, not SMS. Internet, browser/OS support and notification settings affect delivery.
- The worker deliberately does not cache authenticated pages or sensitive records offline.
- Sign out disables push on the current device; other devices remain registered.
- Push/email bodies do not contain citizen names, IDs, evidence or complaint descriptions.

## Acceptance Checks

1. Register a citizen in barangay A: only active approved captain(s) in A receive alerts.
2. Confirm a Pending citizen cannot submit via UI or API and cannot change approval/role.
3. Approve as the correct captain: exactly one approval event is queued for the citizen; repeat approval creates no duplicate event.
4. Submit a complaint: captain A receives email and enabled-device push; captain B receives neither.
5. Change/deactivate a captain before queued delivery: old-barangay delivery is cancelled.
6. Verify Gmail inbox delivery, expired OAuth tokens, retry/backoff and failed-record monitoring.
7. Test push with the app closed on actual Android/iPhone devices, denied permission, sign-out and expired subscriptions.
8. Keep existing escalation, resolution, registration agreement and in-app notification tests passing.
