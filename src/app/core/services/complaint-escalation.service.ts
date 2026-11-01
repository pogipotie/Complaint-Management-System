import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface EscalationRecord {
  is_escalated: boolean;
  escalated_by: string | null;
  escalated_by_role: string | null;
  escalated_at: string | null;
  escalation_reason: string | null;
}

export interface EscalationEligibility extends EscalationRecord {
  can_escalate: boolean;
  eligible_at: string;
  server_now: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class ComplaintEscalationService {
  private supabase = inject(SupabaseService).supabase;

  async eligibility(complaintId: string): Promise<EscalationEligibility> {
    const { data, error } = await this.supabase.rpc(
      'get_complaint_escalation_eligibility', { cid: complaintId }
    );
    if (error) throw error;
    if (!data) throw new Error('Could not check escalation eligibility.');
    return data as EscalationEligibility;
  }

  async escalate(complaintId: string, reason: string): Promise<EscalationRecord> {
    const { data, error } = await this.supabase.rpc('escalate_complaint', {
      cid: complaintId, reason: reason.trim()
    });
    if (error) throw error;
    if (!data) throw new Error('Could not confirm complaint escalation.');
    return data as EscalationRecord;
  }
}
