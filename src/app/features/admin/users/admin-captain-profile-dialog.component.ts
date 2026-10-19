import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CaptainDirectoryService, CaptainDirectorySubmission } from '../../../core/services/captain-directory.service';
import { CaptainAvatarComponent } from '../../../shared/components/captain-avatar.component';

@Component({
  selector: 'app-admin-captain-profile-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, CaptainAvatarComponent],
  template: `
    <h2 mat-dialog-title>Captain Profile & Publication Review</h2>
    <mat-dialog-content>
      <section class="border-2 border-gray-900 p-4 mb-4">
        <div class="flex items-center gap-4 mb-4">
          <div class="h-16 w-16 bg-primary-100 border-2 border-gray-900 overflow-hidden">
            <app-captain-avatar [path]="data.user.profile_picture_path" [name]="data.user.full_name"></app-captain-avatar>
          </div>
          <div><strong>{{ data.user.full_name }}</strong><p>{{ data.user.barangay }}</p></div>
        </div>
        <h3 class="font-bold mb-3">Private Account Information (Admin Only)</h3>
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div *ngFor="let field of privateFields">
            <dt class="text-gray-500 font-bold">{{ field.label }}</dt><dd>{{ data.user[field.key] ?? 'Not provided' }}</dd>
          </div>
        </dl>
      </section>
      <p *ngIf="loading" role="status">Loading submission...</p>
      <p *ngIf="error" role="alert" class="text-red-700">{{ error }}</p>
      <button *ngIf="error" mat-button (click)="load()" [disabled]="busy">Reload Submission</button>
      <p *ngIf="!loading && !submission && !error">This captain has not submitted a public profile.</p>
      <ng-container *ngIf="submission as profile">
        <p class="mb-4">Review status: <strong class="uppercase">{{ profile.status }}</strong></p>
        <p *ngIf="profile.review_note" class="mb-4">{{ profile.review_note }}</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <section *ngFor="let version of [{ title: 'Submitted for Review', value: profile.draft }, { title: 'Currently Published', value: profile.published }]" class="border-2 border-gray-900 p-4">
            <h3 class="font-bold mb-3">{{ version.title }}</h3>
            <ng-container *ngIf="version.value as info; else unpublished">
              <div class="h-20 w-20 bg-primary-100 border-2 border-gray-900 mb-3">
                <app-captain-avatar [path]="info.photo_path" [name]="info.full_name"></app-captain-avatar>
              </div>
              <dl class="space-y-3 text-sm">
                <div *ngFor="let field of publicFields">
                  <dt class="text-gray-500 font-bold">{{ field.label }}</dt>
                  <dd class="whitespace-pre-wrap break-words">{{ fieldValue(info, field.key) }}</dd>
                </div>
              </dl>
            </ng-container>
            <ng-template #unpublished><p>Not published</p></ng-template>
          </section>
        </div>
        <label class="block mt-4 text-sm font-bold" for="review-note">Review Note (required for rejection)</label>
        <textarea id="review-note" [(ngModel)]="note" maxlength="2000" rows="3" class="w-full border-2 border-gray-900 p-3 mt-2"></textarea>
        <p *ngIf="success" role="status" class="text-green-700">{{ success }}</p>
        <div class="flex flex-wrap gap-2 mt-4">
          <button *ngIf="profile.status === 'pending'" mat-flat-button color="primary" (click)="review('approved')" [disabled]="busy || loading">Approve & Publish</button>
          <button *ngIf="profile.status === 'pending'" mat-flat-button color="warn" (click)="review('rejected')" [disabled]="busy || loading || !note.trim()">Reject Submission</button>
          <button *ngIf="profile.published" mat-stroked-button (click)="review('withdrawn')" [disabled]="busy || loading">Withdraw Public Profile</button>
        </div>
      </ng-container>
    </mat-dialog-content>
    <mat-dialog-actions align="end"><button mat-flat-button mat-dialog-close [disabled]="busy">Close</button></mat-dialog-actions>
  `
})
export class AdminCaptainProfileDialogComponent implements OnInit {
  private directory = inject(CaptainDirectoryService);
  submission: CaptainDirectorySubmission | null = null;
  loading = true;
  busy = false;
  error = '';
  success = '';
  note = '';
  privateFields = [
    { key: 'phone', label: 'Personal Phone' }, { key: 'street_address', label: 'Home Address' },
    { key: 'occupation', label: 'Occupation' }, { key: 'civil_status', label: 'Civil Status' },
    { key: 'emergency_contact_name', label: 'Emergency Contact' },
    { key: 'emergency_contact_number', label: 'Emergency Phone' },
    { key: 'verification_status', label: 'Verification Status' }, { key: 'is_active', label: 'Active Account' }
  ];
  publicFields = [
    { key: 'full_name', label: 'Full Name' }, { key: 'barangay', label: 'Assigned Barangay' },
    { key: 'official_title', label: 'Official Title' }, { key: 'term_start', label: 'Term Start' },
    { key: 'term_end', label: 'Term End' }, { key: 'office_address', label: 'Office Address' },
    { key: 'office_hours', label: 'Office Hours' }, { key: 'official_phone', label: 'Official Phone' },
    { key: 'official_email', label: 'Official Email' }, { key: 'biography', label: 'Biography / Public Message' }
  ];
  constructor(@Inject(MAT_DIALOG_DATA) public data: { user: any }) {}
  ngOnInit() { void this.load(); }
  fieldValue(info: object, key: string) { return (info as Record<string, unknown>)[key] || 'Not provided'; }
  async load() {
    this.loading = true;
    this.error = '';
    this.submission = null;
    try { this.submission = await this.directory.loadSubmission(this.data.user.id); }
    catch (err: any) { this.error = err.message || 'Could not load submission.'; }
    finally { this.loading = false; }
  }
  async review(decision: string) {
    if (!this.submission || this.busy) return;
    this.busy = true;
    this.error = '';
    this.success = '';
    try {
      await this.directory.review(this.submission, decision, this.note);
      this.note = '';
      await this.load();
      this.success = 'Review saved.';
    } catch (err: any) { this.error = err.message || 'Review failed.'; }
    finally { this.busy = false; }
  }
}
