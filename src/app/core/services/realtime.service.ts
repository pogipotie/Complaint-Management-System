import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Subject, Observable } from 'rxjs';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  private supabaseService = inject(SupabaseService);
  
  private complaintsSubject = new Subject<any>();
  private adminChannel: RealtimeChannel | null = null;

  get complaintsChanges$(): Observable<any> {
    return this.complaintsSubject.asObservable();
  }

  subscribeToAllComplaints() {
    if (this.adminChannel) return;

    this.adminChannel = this.supabaseService.supabase.channel('admin-complaints-all')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'complaints' },
        (payload) => {
          this.complaintsSubject.next(payload);
        }
      )
      .subscribe();
  }

  unsubscribeFromAllComplaints() {
    if (this.adminChannel) {
      this.supabaseService.supabase.removeChannel(this.adminChannel);
      this.adminChannel = null;
    }
  }
}
