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

  async uploadFile(bucket: string, path: string, file: File): Promise<{ path: string | null; error: any }> {
    const { data, error } = await this.supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
    });

    if (error) {
      return { path: null, error };
    }

    // Return the storage path (relative to the bucket), not a public URL.
    // The complaint_images bucket is private, so callers must resolve the
    // path to a signed URL via getSignedUrl() before displaying.
    return { path: data?.path ?? path, error: null };
  }

  /**
   * Generate a time-limited signed URL for a private bucket object.
   * @param bucket The storage bucket id
   * @param path The object path inside the bucket
   * @param expiresIn Expiration in seconds (default: 1 hour)
   */
  async getSignedUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<string | null> {
    if (!path) return null;
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error || !data?.signedUrl) {
      console.error('Failed to create signed URL:', error);
      return null;
    }
    return data.signedUrl;
  }

  /**
   * Extract the object path from either a legacy public URL
   * (https://.../storage/v1/object/public/{bucket}/{path})
   * or a path stored directly in the database.
   */
  extractStoragePath(stored: string | null | undefined, bucket: string): string | null {
    if (!stored) return null;
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = stored.indexOf(marker);
    if (idx !== -1) {
      return stored.substring(idx + marker.length);
    }
    // Already a relative path, or a path passed in directly
    return stored;
  }

  /**
   * Convenience helper: resolve whatever is stored in the DB
   * (legacy full URL or new path) to a fresh signed URL.
   * Returns null if the value is empty or signing fails.
   */
  async resolveSignedUrl(stored: string | null | undefined, bucket: string, expiresIn: number = 3600): Promise<string | null> {
    const path = this.extractStoragePath(stored, bucket);
    if (!path) return null;
    return this.getSignedUrl(bucket, path, expiresIn);
  }
}
