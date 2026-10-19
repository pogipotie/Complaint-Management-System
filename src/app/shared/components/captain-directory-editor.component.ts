import { Component, Input, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CaptainDirectoryService, CaptainDirectorySubmission } from '../../core/services/captain-directory.service';

@Component({
  selector: 'app-captain-directory-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="bg-white border-2 border-gray-900 rounded-sm shadow-[4px_4px_0px_0px_rgba(17,24,39,1)]">
      <h3 class="p-4 bg-primary-50 border-b-2 border-gray-900 font-black uppercase tracking-widest">Public Directory Profile</h3>
      <div class="p-6 space-y-4">
        <p class="text-sm text-gray-700">Only approved official details appear publicly. Your personal phone, home address, civil status, and emergency contacts are never included.</p>
        <p class="text-sm font-bold">Save your name and photo above before submitting. They will be included with your assigned barangay for admin review.</p>
        <p *ngIf="submission" class="text-sm">Review status: <strong class="uppercase">{{ submission.status }}</strong>.
          {{ submission.published ? 'Your last approved version remains public until replaced or withdrawn.' : 'Your profile is not published yet.' }}
        </p>
        <p *ngIf="submission?.review_note" class="border-l-4 border-amber-600 p-3 bg-amber-50">{{ submission?.review_note }}</p>
        <p *ngIf="loading" role="status">Loading directory submission...</p>
        <p *ngIf="error" role="alert" class="text-red-700 font-bold">{{ error }}</p>
        <button *ngIf="loadFailed" mat-button (click)="load()">Retry</button>
        <form *ngIf="!loading && !loadFailed" [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <mat-form-field *ngFor="let field of fields" appearance="outline" [class.sm:col-span-2]="field.key === 'biography'">
              <mat-label>{{ field.label }}</mat-label>
              <textarea *ngIf="field.key === 'biography'; else singleLine" matInput [formControlName]="field.key" rows="3" maxlength="2000"></textarea>
              <ng-template #singleLine><input matInput [type]="field.type" [formControlName]="field.key" maxlength="2000"></ng-template>
              <mat-error>Enter a valid {{ field.label.toLowerCase() }} (maximum 2000 characters).</mat-error>
            </mat-form-field>
          </div>
          <p *ngIf="form.hasError('termOrder')" role="alert" class="text-red-700">Term end must not be before term start.</p>
          <label class="flex gap-3 items-start text-sm">
            <input type="checkbox" formControlName="consent" class="mt-1">
            I confirm these are official contact details and consent to publishing my name, photo, barangay, and the fields above after admin approval.
          </label>
          <p *ngIf="success" role="status" class="text-green-700 font-bold">{{ success }}</p>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || busy || !userId || blocked">
            {{ busy ? 'Submitting...' : 'Submit for Admin Approval' }}
          </button>
        </form>
      </div>
    </section>
  `,
  styles: [`mat-form-field { width: 100%; }`]
})
export class CaptainDirectoryEditorComponent implements OnChanges {
  @Input() userId: string | null = null;
  @Input() blocked = false;
  private directory = inject(CaptainDirectoryService);
  private fb = inject(FormBuilder);
  fields = [
    { key: 'official_title', label: 'Official Title', type: 'text' },
    { key: 'official_phone', label: 'Official Office Phone', type: 'tel' },
    { key: 'official_email', label: 'Official Office Email', type: 'email' },
    { key: 'office_address', label: 'Barangay Office Address', type: 'text' },
    { key: 'office_hours', label: 'Office Hours', type: 'text' },
    { key: 'term_start', label: 'Term Start', type: 'date' },
    { key: 'term_end', label: 'Term End', type: 'date' },
    { key: 'biography', label: 'Biography / Public Message', type: 'text' }
  ];
  form = this.fb.nonNullable.group({
    official_title: ['Barangay Captain', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(2000)]],
    official_phone: ['', Validators.maxLength(2000)],
    official_email: ['', [Validators.email, Validators.maxLength(2000)]],
    office_address: ['', Validators.maxLength(2000)],
    office_hours: ['', Validators.maxLength(2000)],
    term_start: [''], term_end: [''], biography: ['', Validators.maxLength(2000)],
    consent: [false, Validators.requiredTrue]
  }, { validators: (control: AbstractControl) => {
    const start = control.get('term_start')?.value;
    const end = control.get('term_end')?.value;
    return start && end && end < start ? { termOrder: true } : null;
  } });
  submission: CaptainDirectorySubmission | null = null;
  loading = false;
  loadFailed = false;
  busy = false;
  error = '';
  success = '';

  ngOnChanges(changes: import('@angular/core').SimpleChanges) {
    if (changes['userId'] && this.userId) void this.load();
  }

  async load() {
    if (!this.userId) return;
    this.loading = true;
    this.loadFailed = false;
    this.error = '';
    try {
      this.submission = await this.directory.loadSubmission(this.userId);
      if (this.submission) {
        const draft = this.submission.draft;
        for (const key of this.fields.map(field => field.key) as Array<keyof Omit<typeof this.form.controls, 'consent'>>) {
          this.form.controls[key].setValue(draft[key] ?? '');
        }
      }
      this.form.controls.consent.setValue(false);
    } catch (err: any) {
      this.loadFailed = true;
      this.error = err.message || 'Could not load your submission.';
    } finally { this.loading = false; }
  }

  async submit() {
    if (this.form.invalid || this.busy || this.blocked || !this.userId) return;
    this.busy = true;
    this.error = '';
    this.success = '';
    try {
      const { consent, ...details } = this.form.getRawValue();
      await this.directory.submit(details, consent);
      await this.load();
      this.success = 'Submitted for admin approval. Unapproved changes are not public.';
    } catch (err: any) { this.error = err.message || 'Submission failed.'; }
    finally { this.busy = false; }
  }
}
