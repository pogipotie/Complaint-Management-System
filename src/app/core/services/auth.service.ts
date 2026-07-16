import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabaseService = inject(SupabaseService);

  get user$() {
    return this.supabaseService.user$;
  }

  get user() {
    return this.supabaseService.user;
  }

  signUp(email: string, password: string): Observable<any> {
    return from(this.supabaseService.supabase.auth.signUp({ email, password }));
  }

  signIn(email: string, password: string): Observable<any> {
    return from(this.supabaseService.supabase.auth.signInWithPassword({ email, password }));
  }

  async checkEmailExists(email: string): Promise<boolean> {
    // We now use a secure RPC function to check if the email exists
    // because Supabase's built-in auth methods mask existence for security.
    const { data, error } = await this.supabaseService.supabase
      .rpc('check_email_exists', { lookup_email: email });
      
    if (error) {
      console.error('Error checking email:', error);
      return false; // Default to false if there's an error
    }
    
    return !!data;
  }

  resetPasswordForEmail(email: string): Observable<any> {
    return from(this.supabaseService.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    }));
  }

  updateUserPassword(password: string): Observable<any> {
    return from(this.supabaseService.supabase.auth.updateUser({ password }));
  }

  signOut(): Observable<any> {
    return from(this.supabaseService.supabase.auth.signOut());
  }

  async getUserProfile(userId: string) {
    const { data, error } = await this.supabaseService.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  }

  async createCaptainAccount(payload: { email: string, password: string, fullName: string, barangay: string }): Promise<any> {
    const { data, error } = await this.supabaseService.supabase
      .rpc('admin_create_captain', {
        captain_email: payload.email,
        captain_password: payload.password,
        captain_full_name: payload.fullName,
        captain_barangay: payload.barangay
      });

    if (error) throw error;
    return data;
  }
}
