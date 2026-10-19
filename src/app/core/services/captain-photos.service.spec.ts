import { TestBed } from '@angular/core/testing';
import { CaptainPhotosService } from './captain-photos.service';
import { SupabaseService } from './supabase.service';

describe('CaptainPhotosService', () => {
  let service: CaptainPhotosService;
  let upload: jasmine.Spy;
  let remove: jasmine.Spy;
  let update: jasmine.Spy;
  let single: jasmine.Spy;
  let eq: jasmine.Spy;
  let signedUrl: jasmine.Spy;
  const owner = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    upload = jasmine.createSpy('upload').and.resolveTo({ error: null });
    remove = jasmine.createSpy('remove').and.resolveTo({ error: null });
    single = jasmine.createSpy('single').and.resolveTo({ data: { id: owner }, error: null });
    const query = { eq: jasmine.createSpy('eq'), select: jasmine.createSpy('select'), single };
    eq = query.eq.and.returnValue(query);
    query.select.and.returnValue(query);
    update = jasmine.createSpy('update').and.returnValue(query);
    signedUrl = jasmine.createSpy('getSignedUrl').and.resolveTo('https://example.test/photo');
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: {
        getSignedUrl: signedUrl,
        supabase: {
          auth: { getUser: jasmine.createSpy().and.resolveTo({ data: { user: { id: owner } }, error: null }) },
          storage: { from: () => ({ upload, remove }) },
          from: () => ({ update })
        }
      } }]
    });
    service = TestBed.inject(CaptainPhotosService);
  });

  it('rejects unsupported, empty, and oversized files', () => {
    expect(() => service.validate(new File(['x'], 'photo.svg', { type: 'image/svg+xml' }))).toThrowError(/JPG/);
    expect(() => service.validate(new File([], 'empty.png', { type: 'image/png' }))).toThrowError(/2 MB/);
    expect(() => service.validate(new File([new Uint8Array(2097153)], 'large.png', { type: 'image/png' }))).toThrowError(/2 MB/);
  });

  it('accepts all supported image types at the size limit', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
      expect(() => service.validate(new File([new Uint8Array(2097152)], 'photo', { type }))).not.toThrow();
    }
  });

  it('uploads to the authenticated owner and removes the old file after saving', async () => {
    const changes: unknown[] = [];
    service.changed$.subscribe(change => changes.push(change));
    const old = `${owner}/old.jpg`;
    const path = await service.upload(new File(['photo'], 'picture.png', { type: 'image/png' }), old);
    expect(path).toMatch(new RegExp(`^${owner}/[a-f0-9-]+\\.png$`));
    expect(eq).toHaveBeenCalledWith('id', owner);
    expect(eq).toHaveBeenCalledWith('role', 'brgy_captain');
    expect(update).toHaveBeenCalledWith({ profile_picture_path: path });
    expect(remove).toHaveBeenCalledWith([old]);
    expect(single).toHaveBeenCalledBefore(remove);
    expect(changes).toEqual([{ userId: owner, path }]);
  });

  it('removes the new file and preserves the previous photo if saving fails', async () => {
    single.and.resolveTo({ data: null, error: new Error('Permission denied') });
    const change = jasmine.createSpy();
    service.changed$.subscribe(change);
    await expectAsync(service.upload(new File(['photo'], 'photo.jpg', { type: 'image/jpeg' }), 'old.jpg'))
      .toBeRejectedWithError('Permission denied');
    expect(remove).toHaveBeenCalledOnceWith([upload.calls.first().args[0]]);
    expect(change).not.toHaveBeenCalled();
  });

  it('does not update the profile when the upload fails', async () => {
    upload.and.resolveTo({ error: new Error('Upload failed') });
    await expectAsync(service.upload(new File(['photo'], 'photo.webp', { type: 'image/webp' }), null))
      .toBeRejectedWithError('Upload failed');
    expect(update).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it('clears the profile reference before deleting the file', async () => {
    await service.remove(`${owner}/old.jpg`);
    expect(update).toHaveBeenCalledWith({ profile_picture_path: null });
    expect(single).toHaveBeenCalledBefore(remove);
  });

  it('shares signed URLs for repeated avatars', async () => {
    await Promise.all([service.resolve('photo.jpg'), service.resolve('photo.jpg')]);
    expect(signedUrl).toHaveBeenCalledTimes(1);
    expect(await service.resolve(null)).toBeNull();
  });
});
