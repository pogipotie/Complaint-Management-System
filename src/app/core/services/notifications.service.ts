import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  user_id: string;
  complaint_id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  complaint?: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private supabaseService = inject(SupabaseService);
  
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private channel: RealtimeChannel | null = null;

  async loadNotifications(userId: string) {
    const { data, error } = await this.supabaseService.supabase
      .from('notifications')
      .select('*, complaint:complaints(id, title, status, location_text, barangay, created_at, category:complaint_categories(name))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      this.notificationsSubject.next(data);
      this.updateUnreadCount(data);
    }
  }

  subscribeToNotifications(userId: string) {
    if (this.channel) return;

    this.channel = this.supabaseService.supabase.channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          // Fetch the new notification with joined complaint details
          const { data } = await this.supabaseService.supabase
            .from('notifications')
            .select('*, complaint:complaints(id, title, status, location_text, barangay, created_at, category:complaint_categories(name))')
            .eq('id', payload.new['id'])
            .single();

          const newNotification = (data || payload.new) as Notification;
          const current = this.notificationsSubject.value;
          const updated = [newNotification, ...current].slice(0, 20); // Keep last 20
          this.notificationsSubject.next(updated);
          this.updateUnreadCount(updated);
        }
      )
      .subscribe();
  }

  unsubscribe() {
    if (this.channel) {
      this.supabaseService.supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  async markAsRead(notificationId: string) {
    const { error } = await this.supabaseService.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (!error) {
      const current = this.notificationsSubject.value;
      const updated = current.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      );
      this.notificationsSubject.next(updated);
      this.updateUnreadCount(updated);
    }
  }

  async markAllAsRead(userId: string) {
    const { error } = await this.supabaseService.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (!error) {
      const current = this.notificationsSubject.value;
      const updated = current.map(n => ({ ...n, is_read: true }));
      this.notificationsSubject.next(updated);
      this.updateUnreadCount(updated);
    }
  }

  async clearAllNotifications(userId: string) {
    const { error } = await this.supabaseService.supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (!error) {
      // Clear local state completely
      this.notificationsSubject.next([]);
      this.unreadCountSubject.next(0);
    }
  }

  private updateUnreadCount(notifications: Notification[]) {
    const count = notifications.filter(n => !n.is_read).length;
    this.unreadCountSubject.next(count);
  }
}
