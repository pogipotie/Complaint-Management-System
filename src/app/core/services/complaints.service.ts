import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, Observable } from 'rxjs';

export interface Complaint {
  id?: string;
  title: string;
  description: string;
  category_id: string;
  custom_category?: string;
  priority: string;
  barangay: string;
  latitude?: number;
  longitude?: number;
  location_text?: string;
  evidence_paths?: string[];
  status?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ComplaintsService {
  private supabaseService = inject(SupabaseService);

  getComplaints(userId?: string): Observable<any> {
    let query = this.supabaseService.supabase
      .from('complaints')
      .select('*, complaint_categories(name), users!complaints_created_by_fkey(full_name)');
    
    if (userId) {
      query = query.eq('created_by', userId);
    }
    
    return from(query.order('created_at', { ascending: false }));
  }

  getComplaint(id: string): Observable<any> {
    return from(this.supabaseService.supabase
      .from('complaints')
      .select('*, complaint_categories(name), complaint_status_history(*), users!complaints_created_by_fkey(full_name)')
      .eq('id', id)
      .single()
    );
  }

  createComplaint(complaint: Complaint): Observable<any> {
    return from(this.supabaseService.supabase
      .from('complaints')
      .insert([complaint])
    );
  }

  updateComplaint(id: string, updates: Partial<Complaint>): Observable<any> {
    return from(this.supabaseService.supabase
      .from('complaints')
      .update(updates)
      .eq('id', id)
      .select()
    );
  }

  deleteComplaint(id: string): Observable<any> {
    return from(this.supabaseService.supabase
      .from('complaints')
      .delete()
      .eq('id', id)
    );
  }

  getCategories(): Observable<any> {
    return from(this.supabaseService.supabase
      .from('complaint_categories')
      .select('*')
      .eq('is_active', true)
    );
  }

  getCommunityComplaints(): Observable<any> {
    return from(this.supabaseService.supabase
      .from('community_complaints')
      .select('*')
      .order('created_at', { ascending: false })
    );
  }

  async toggleUpvote(complaintId: string, currentUserId: string, hasUpvoted: boolean): Promise<any> {
    if (hasUpvoted) {
      return await this.supabaseService.supabase
        .from('complaint_upvotes')
        .delete()
        .eq('complaint_id', complaintId)
        .eq('user_id', currentUserId);
    } else {
      return await this.supabaseService.supabase
        .from('complaint_upvotes')
        .insert({ complaint_id: complaintId, user_id: currentUserId });
    }
  }
}
