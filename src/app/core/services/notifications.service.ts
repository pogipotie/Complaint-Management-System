import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject } from 'rxjs';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  user_id: string;
  complaint_id: string;
  related_user_id?: string | null;
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
  private userId: string | null = null;
  private generation = 0;

  async loadNotifications(userId: string) {
    if (this.userId && this.userId !== userId) this.unsubscribe();
    this.userId = userId;
    const generation = this.generation;
    const existingIds = new Set(this.notificationsSubject.value.map(note => note.id));
    const { data, error } = await this.supabaseService.supabase
      .from('notifications')
      .select('*, complaint:complaints(id, title, status, location_text, barangay, created_at, category:complaint_categories(name))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data && this.userId === userId && this.generation === generation) {
      // Keep live inserts that arrived while the initial request was in flight.
      const liveNotifications = this.notificationsSubject.value.filter(note =>
        note.user_id === userId && !existingIds.has(note.id)
      );
      this.publishNotifications([...liveNotifications, ...data]);
    }
  }

  subscribeToNotifications(userId: string) {
    if (this.channel && this.userId === userId) return;
    if (this.userId && this.userId !== userId) this.unsubscribe();
    this.userId = userId;
    const generation = this.generation;

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
          if (this.userId !== userId || this.generation !== generation) return;
          const current = this.notificationsSubject.value;
          this.publishNotifications([newNotification, ...current]);
        }
      )
      .subscribe();
  }

  unsubscribe() {
    this.generation++;
    this.userId = null;
    this.publishNotifications([]);
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

  private publishNotifications(notifications: Notification[]) {
    const unique = new Map<string, Notification>();
    for (const note of notifications) {
      if (!unique.has(note.id)) unique.set(note.id, note);
    }

    // Detail requests can finish out of order; timestamps determine recency.
    const sorted = [...unique.values()]
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .slice(0, 20);
    this.notificationsSubject.next(sorted);
    this.updateUnreadCount(sorted);
  }

  private updateUnreadCount(notifications: Notification[]) {
    const count = notifications.filter(n => !n.is_read).length;
    this.unreadCountSubject.next(count);
  }
}
