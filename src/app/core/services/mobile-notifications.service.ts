import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class MobileNotificationsService {
  private readonly supabase = inject(SupabaseService);

  get supported(): boolean {
    return typeof window !== 'undefined' && window.isSecureContext &&
      'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  async isEnabled(): Promise<boolean> {
    if (!this.supported) return false;
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return false;
    const { data, error } = await this.supabase.supabase.from('push_subscriptions')
      .select('id').eq('endpoint', subscription.endpoint).maybeSingle();
    if (error) throw error;
    return !!data;
  }

  async enable(): Promise<void> {
    if (!this.supported) throw new Error('Use HTTPS and a supported browser. On iPhone, add this app to your Home Screen first.');
    // Permission must be requested directly from the user's click.
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Notifications are blocked. Enable them in your browser or phone settings.');
    const { data, error } = await this.supabase.supabase.functions.invoke('push-config');
    if (error || !data?.publicKey) throw new Error('Mobile notifications are not configured yet. Contact the administrator.');
    const registration = await navigator.serviceWorker.register('/notification-worker.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    const key = Uint8Array.from(atob(data.publicKey.replace(/-/g, '+').replace(/_/g, '/')),
      character => character.charCodeAt(0));
    const subscription = existing || await registration.pushManager.subscribe({
      userVisibleOnly: true, applicationServerKey: key
    });
    const payload = subscription.toJSON();
    const result = await this.supabase.supabase.rpc('register_push_subscription', {
      push_endpoint: subscription.endpoint,
      push_p256dh: payload.keys?.['p256dh'], push_auth: payload.keys?.['auth']
    });
    if (result.error) {
      if (!existing) await subscription.unsubscribe();
      throw new Error('Unable to register this device for mobile notifications.');
    }
  }

  async disable(): Promise<void> {
    if (!this.supported) return;
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;
    // Remove server delivery before unsubscribing, including when switching accounts.
    const { error } = await this.supabase.supabase.from('push_subscriptions')
      .delete().eq('endpoint', subscription.endpoint);
    if (error) throw new Error('Unable to disable mobile notifications. Please try again.');
    await subscription.unsubscribe();
  }
}
