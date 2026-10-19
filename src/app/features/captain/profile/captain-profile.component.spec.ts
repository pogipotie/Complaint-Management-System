import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';
import { CaptainProfileComponent } from './captain-profile.component';
import { CaptainPhotosService } from '../../../core/services/captain-photos.service';
import { SupabaseService } from '../../../core/services/supabase.service';

describe('Captain profile photo controls', () => {
  let fixture: ComponentFixture<CaptainProfileComponent>;
  let component: CaptainProfileComponent;
  let photos: { validate: jasmine.Spy; upload: jasmine.Spy; remove: jasmine.Spy; resolve: jasmine.Spy; changed$: Subject<unknown> };

  beforeEach(async () => {
    photos = {
      validate: jasmine.createSpy(),
      upload: jasmine.createSpy().and.resolveTo('user/new.png'),
      remove: jasmine.createSpy().and.resolveTo(undefined),
      resolve: jasmine.createSpy().and.resolveTo(null),
      changed$: new Subject()
    };
    const query = {
      select: () => query, eq: () => query,
      single: async () => ({ data: { full_name: 'Captain Test', barangay: 'Test', profile_picture_path: null }, error: null })
    };
    await TestBed.configureTestingModule({
      imports: [CaptainProfileComponent],
      providers: [
        provideNoopAnimations(),
        { provide: CaptainPhotosService, useValue: photos },
        { provide: SupabaseService, useValue: { supabase: {
          auth: { getUser: async () => ({ data: { user: { id: 'user' } } }) },
          from: () => query
        } } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(CaptainProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders the photo section, format limits, and initials', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('#photo-heading')?.textContent).toContain('Profile Picture');
    expect(element.querySelector('#photo-help')?.textContent).toContain('Maximum 2 MB');
    expect(element.querySelector('input[type=file]')?.getAttribute('accept')).toBe('image/jpeg,image/png,image/webp');
    expect(element.querySelector('app-captain-avatar')?.textContent).toContain('C');
  });

  it('previews the selection and uploads separately from personal information', async () => {
    spyOn(URL, 'createObjectURL').and.returnValue('blob:test-photo');
    const revoke = spyOn(URL, 'revokeObjectURL');
    const file = new File(['photo'], 'photo.png', { type: 'image/png' });
    component.selectPhoto({ target: { files: [file], value: '' } } as unknown as Event);
    fixture.detectChanges();
    expect(component.photoPreview).toBe('blob:test-photo');
    expect(fixture.nativeElement.textContent).toContain('Save Photo');

    await component.uploadPhoto();
    fixture.detectChanges();
    expect(photos.upload).toHaveBeenCalledWith(file, null);
    expect(component.photoPath).toBe('user/new.png');
    expect(component.selectedPhoto).toBeNull();
    expect(revoke).toHaveBeenCalledWith('blob:test-photo');
    expect(fixture.nativeElement.querySelector('[role=status]')?.textContent).toContain('saved');
  });

  it('shows upload errors while retaining the selected file for retry', async () => {
    component.selectedPhoto = new File(['photo'], 'photo.png', { type: 'image/png' });
    photos.upload.and.rejectWith(new Error('Upload failed'));
    await component.uploadPhoto();
    fixture.detectChanges();
    expect(component.selectedPhoto).not.toBeNull();
    expect(component.photoBusy).toBeFalse();
    expect(fixture.nativeElement.querySelector('[role=alert]')?.textContent).toContain('Upload failed');
  });

  it('removes an existing photo and restores the initials fallback', async () => {
    component.photoPath = 'user/old.png';
    await component.removePhoto();
    fixture.detectChanges();
    expect(photos.remove).toHaveBeenCalledWith('user/old.png');
    expect(component.photoPath).toBeNull();
    expect(fixture.nativeElement.querySelector('app-captain-avatar')?.textContent).toContain('C');
  });
});
