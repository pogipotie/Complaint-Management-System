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
}
