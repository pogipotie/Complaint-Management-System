import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { OverlayContainer } from '@angular/cdk/overlay';
import { ComplaintDetailDialogComponent } from '../../features/citizen/complaints/complaint-detail-dialog.component';
import { DescriptionDialogComponent } from './description-dialog/description-dialog.component';
import { LegalDialogComponent } from './legal-dialog/legal-dialog.component';
import { SupabaseService } from '../../core/services/supabase.service';

describe('Dialog close controls', () => {
  let dialog: MatDialog;
  let overlay: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatDialogModule, ComplaintDetailDialogComponent, DescriptionDialogComponent, LegalDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: SupabaseService, useValue: {} }
      ]
    }).compileComponents();
    dialog = TestBed.inject(MatDialog);
    overlay = TestBed.inject(OverlayContainer).getContainerElement();
  });

  afterEach(() => dialog.closeAll());

  function assertSingleDismissButton(label: string): HTMLButtonElement {
    const buttons = Array.from(overlay.querySelectorAll<HTMLButtonElement>('button'));
    const closeButtons = buttons.filter(button => button.textContent?.trim() === label);
    expect(closeButtons.length).toBe(1);
    const closeIcons = Array.from(overlay.querySelectorAll('button mat-icon'))
      .filter(icon => icon.textContent?.trim() === 'close');
    expect(closeIcons.length).toBe(0);
    return closeButtons[0];
  }

  it('keeps the description Close button functional without a duplicate X', async () => {
    const ref = dialog.open(DescriptionDialogComponent, {
      data: { title: 'Complaint description', description: 'Resident report' }
    });
    ref.componentRef!.changeDetectorRef.detectChanges();
    const close = spyOn(ref, 'close').and.callThrough();
    assertSingleDismissButton('Close').click();
    expect(close).toHaveBeenCalledTimes(1);
  });

  for (const type of ['privacy', 'terms'] as const) {
    it(`keeps the ${type} acknowledgment functional without a duplicate X`, async () => {
      const ref = dialog.open(LegalDialogComponent, { data: { type } });
      ref.componentRef!.changeDetectorRef.detectChanges();
      const close = spyOn(ref, 'close').and.callThrough();
      assertSingleDismissButton('I Understand').click();
      expect(close).toHaveBeenCalledTimes(1);
    });
  }

  for (const role of ['citizen', 'admin', 'brgy_captain']) {
    it(`keeps complaint Close functional for ${role} without a duplicate X`, async () => {
      // Isolate dismissal from network, realtime, and Google Maps initialization.
      spyOn(ComplaintDetailDialogComponent.prototype, 'ngOnInit').and.resolveTo();
      const ref = dialog.open(ComplaintDetailDialogComponent, {
        data: {
          id: 'complaint-12345678', title: 'Test Complaint', status: 'pending',
          priority: 'low', description: 'Test description', evidence_paths: []
        }
      });
      ref.componentInstance.currentRole = role;
      ref.componentInstance.isCitizen = role === 'citizen';
      ref.componentRef!.changeDetectorRef.detectChanges();
      const close = spyOn(ref, 'close').and.callThrough();
      assertSingleDismissButton('Close').click();
      expect(close).toHaveBeenCalledTimes(1);
    });
  }
});
