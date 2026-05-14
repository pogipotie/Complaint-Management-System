import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public supabase: SupabaseClient;
  private currentUser: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  private sessionInitialized = new BehaviorSubject<boolean>(false);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.currentUser.next(session?.user ?? null);
      this.sessionInitialized.next(true);
    });

    this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentUser.next(session?.user ?? null);
      // Ensure initialization flag is set on any auth state change if it wasn't already
      if (!this.sessionInitialized.value) {
        this.sessionInitialized.next(true);
      }
    });
  }

  get user$(): Observable<User | null> {
    // Only emit the user once the initial session has been fetched
    return this.sessionInitialized.pipe(
      filter(isInit => isInit === true),
      map(() => this.currentUser.value)
    );
  }

  get user(): User | null {
    return this.currentUser.value;
  }

  async uploadFile(bucket: string, path: string, file: File): Promise<{ url: string | null; error: any }> {
    const { data, error } = await this.supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
    });

    if (error) {
      return { url: null, error };
    }

    const { data: publicUrlData } = this.supabase.storage.from(bucket).getPublicUrl(path);
    return { url: publicUrlData.publicUrl, error: null };
  }
}
