import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface CaptainPublicProfile {
  full_name: string;
  barangay: string;
  photo_path: string | null;
  official_title: string;
  term_start: string | null;
  term_end: string | null;
  office_address: string | null;
  office_hours: string | null;
  official_phone: string | null;
  official_email: string | null;
  biography: string | null;
}

export interface CaptainDirectorySubmission {
  user_id: string;
  draft: CaptainPublicProfile;
  published: CaptainPublicProfile | null;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  version: number;
  review_note: string | null;
}

@Injectable({ providedIn: 'root' })
export class CaptainDirectoryService {
  private supabase = inject(SupabaseService).supabase;

  async loadSubmission(userId: string): Promise<CaptainDirectorySubmission | null> {
    const { data, error } = await this.supabase.from('captain_directory_profiles')
      .select('user_id, draft, published, status, version, review_note').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data;
  }

  async submit(details: Record<string, string>, consent: boolean): Promise<void> {
    const { error } = await this.supabase.rpc('submit_captain_directory_profile', { details, consent });
    if (error) throw error;
  }

  async review(submission: CaptainDirectorySubmission, decision: string, note: string): Promise<void> {
    const { error } = await this.supabase.rpc('review_captain_directory_profile', {
      captain_id: submission.user_id, expected_version: submission.version, decision, note
    });
    if (error) throw error;
  }

  async publicProfiles(): Promise<CaptainPublicProfile[]> {
    const { data, error } = await this.supabase.rpc('get_public_captain_directory');
    if (error) throw error;
    return data ?? [];
  }
}
