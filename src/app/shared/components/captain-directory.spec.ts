import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { CaptainDirectoryService } from '../../core/services/captain-directory.service';
import { CaptainPhotosService } from '../../core/services/captain-photos.service';
import { CaptainDirectoryEditorComponent } from './captain-directory-editor.component';
import { CaptainDirectoryComponent } from '../../features/shared/captain-directory.component';
import { AdminCaptainProfileDialogComponent } from '../../features/admin/users/admin-captain-profile-dialog.component';

describe('Captain directory workflow', () => {
  let directory: { loadSubmission: jasmine.Spy; submit: jasmine.Spy; review: jasmine.Spy; publicProfiles: jasmine.Spy };
  const published = {
    full_name: 'Captain Test', barangay: 'Test Barangay', photo_path: null,
    official_title: 'Barangay Captain', official_phone: 'Office number',
    official_email: 'office@example.test', office_address: 'Barangay Hall', office_hours: '8 AM - 5 PM',
    term_start: null, term_end: null, biography: 'Public message'
  };
  beforeEach(async () => {
    directory = {
      loadSubmission: jasmine.createSpy().and.resolveTo(null),
      submit: jasmine.createSpy().and.resolveTo(undefined),
      review: jasmine.createSpy().and.resolveTo(undefined),
      publicProfiles: jasmine.createSpy().and.resolveTo([published])
    };
    await TestBed.configureTestingModule({
      imports: [CaptainDirectoryEditorComponent, CaptainDirectoryComponent, AdminCaptainProfileDialogComponent],
      providers: [
        provideNoopAnimations(), provideRouter([]),
        { provide: CaptainDirectoryService, useValue: directory },
        { provide: CaptainPhotosService, useValue: { resolve: async () => null, changed$: new Subject() } },
        { provide: MAT_DIALOG_DATA, useValue: { user: {
          id: 'captain-id', full_name: 'Captain Test', barangay: 'Test Barangay', phone: 'Private phone'
        } } }
      ]
    }).compileComponents();
  });

  it('requires consent and sends only official fields', async () => {
    const editor = TestBed.createComponent(CaptainDirectoryEditorComponent).componentInstance;
    editor.userId = 'captain-id';
    await editor.submit();
    expect(directory.submit).not.toHaveBeenCalled();
    editor.form.controls.consent.setValue(true);
    await editor.submit();
    const [details, consent] = directory.submit.calls.mostRecent().args;
    expect(consent).toBeTrue();
    expect(details.official_title).toBe('Barangay Captain');
    expect(details.phone).toBeUndefined();
    expect(details.user_id).toBeUndefined();
    expect(details.photo_path).toBeUndefined();
    expect(editor.form.controls.consent.value).toBeFalse();
  });

  it('rejects invalid email and reversed term dates', () => {
    const editor = TestBed.createComponent(CaptainDirectoryEditorComponent).componentInstance;
    editor.form.patchValue({ official_email: 'invalid', term_start: '2026-10-19', term_end: '2025-01-01', consent: true });
    expect(editor.form.invalid).toBeTrue();
    expect(editor.form.hasError('termOrder')).toBeTrue();
  });

  it('does not auto-consent when loading an earlier submission', async () => {
    directory.loadSubmission.and.resolveTo({ draft: published, published, status: 'pending', version: 2 });
    const editor = TestBed.createComponent(CaptainDirectoryEditorComponent).componentInstance;
    editor.userId = 'captain-id';
    await editor.load();
    expect(editor.form.controls.official_email.value).toBe('office@example.test');
    expect(editor.form.controls.consent.value).toBeFalse();
  });

  it('renders only public fields and filters by barangay', async () => {
    const fixture = TestBed.createComponent(CaptainDirectoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Office number');
    expect(fixture.nativeElement.textContent).not.toContain('Private phone');
    fixture.componentInstance.search = 'test barangay';
    expect(fixture.componentInstance.filtered.length).toBe(1);
    fixture.componentInstance.search = 'other barangay';
    expect(fixture.componentInstance.filtered.length).toBe(0);
    expect(directory.loadSubmission).not.toHaveBeenCalled();
  });

  it('shows a load error without retaining stale public cards', async () => {
    directory.publicProfiles.and.rejectWith(new Error('Unavailable'));
    const page = TestBed.createComponent(CaptainDirectoryComponent).componentInstance;
    page.profiles = [published];
    await page.load();
    expect(page.profiles).toEqual([]);
    expect(page.error).toContain('Could not load');
  });

  it('shows private details only in admin review and preserves one Close button', async () => {
    directory.loadSubmission.and.resolveTo({ user_id: 'captain-id', draft: published, published: null, status: 'pending', version: 3 });
    const fixture = TestBed.createComponent(AdminCaptainProfileDialogComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Private phone');
    expect(fixture.nativeElement.textContent).toContain('Approve & Publish');
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    expect(buttons.filter(button => button.textContent?.trim() === 'Close').length).toBe(1);
    const submission = fixture.componentInstance.submission;
    await fixture.componentInstance.review('approved');
    expect(directory.review).toHaveBeenCalledWith(submission, 'approved', '');
  });
});
