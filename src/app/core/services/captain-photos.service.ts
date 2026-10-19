import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class CaptainPhotosService {
  private supabaseService = inject(SupabaseService);
  private urls = new Map<string, { expires: number; url: Promise<string | null> }>();
  readonly changed$ = new Subject<{ userId: string; path: string | null }>();
  readonly bucket = 'captain_photos';

  validate(file: File): void {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('Choose a JPG, PNG, or WebP image.');
    }
    if (!file.size || file.size > 2 * 1024 * 1024) {
      throw new Error('Choose an image smaller than or equal to 2 MB.');
    }
  }

  resolve(path: string | null | undefined): Promise<string | null> {
    if (!path) return Promise.resolve(null);
    const cached = this.urls.get(path);
    if (cached && cached.expires > Date.now()) return cached.url;
    const url = this.supabaseService.getSignedUrl(this.bucket, path, 3600);
    this.urls.set(path, { expires: Date.now() + 3300000, url });
    void url.then(value => { if (!value) this.urls.delete(path); });
    return url;
  }

  async upload(file: File, previousPath: string | null): Promise<string> {
    this.validate(file);
    const userId = await this.ownerId();
    const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
    const path = `${userId}/${crypto.randomUUID()}.${extension}`;
    const storage = this.supabaseService.supabase.storage.from(this.bucket);
    const { error } = await storage.upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    try {
      await this.savePath(userId, path);
    } catch (err) {
      await storage.remove([path]);
      throw err;
    }
    this.changed$.next({ userId, path });
    if (previousPath && previousPath !== path) await this.cleanup(previousPath);
    return path;
  }

  async remove(previousPath: string): Promise<void> {
    const userId = await this.ownerId();
    await this.savePath(userId, null);
    this.changed$.next({ userId, path: null });
    await this.cleanup(previousPath);
  }

  private async ownerId(): Promise<string> {
    const { data: { user }, error } = await this.supabaseService.supabase.auth.getUser();
    if (error || !user) throw new Error('Sign in again to update your profile picture.');
    return user.id;
  }

  private async savePath(userId: string, path: string | null): Promise<void> {
    const { data, error } = await this.supabaseService.supabase.from('users')
      .update({ profile_picture_path: path })
      .eq('id', userId).eq('role', 'brgy_captain').select('id').single();
    if (error) throw error;
    if (!data) throw new Error('Only captains can update their own profile picture.');
  }

  private async cleanup(path: string): Promise<void> {
    this.urls.delete(path);
    const { error } = await this.supabaseService.supabase.storage.from(this.bucket).remove([path]);
    if (error) console.warn('Could not remove the unused captain photo:', error.message);
  }
}
