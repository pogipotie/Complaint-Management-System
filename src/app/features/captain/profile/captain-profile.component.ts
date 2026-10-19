import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { SupabaseService } from '../../../core/services/supabase.service';
import { MUNICIPALITY_CONFIG } from '../../../core/constants/municipality.config';
import { CaptainPhotosService } from '../../../core/services/captain-photos.service';
import { CaptainAvatarComponent } from '../../../shared/components/captain-avatar.component';

@Component({
  selector: 'app-captain-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    CaptainAvatarComponent
  ],
  template: `
    <div class="max-w-3xl mx-auto space-y-6 pb-12">
      <!-- Header Section -->
      <div class="flex flex-col gap-2 mb-8">
        <h2 class="text-3xl font-black leading-7 text-gray-900 sm:truncate sm:tracking-tight flex items-center gap-3 uppercase" style="font-family: 'Arial Black', Impact, sans-serif;">
          <mat-icon class="text-primary-600 scale-150 mr-2">manage_accounts</mat-icon>
          Profile Settings
        </h2>
        <p class="mt-2 text-sm font-bold text-gray-600 uppercase tracking-widest">
          Manage your personal information and contact details.
        </p>
      </div>

      <div *ngIf="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>

      <ng-container *ngIf="!loading">
        <section class="bg-white border-2 border-gray-900 rounded-sm shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] overflow-hidden" aria-labelledby="photo-heading">
          <div class="border-b-2 border-gray-900 bg-primary-50 p-4">
            <h3 id="photo-heading" class="font-black uppercase tracking-widest flex items-center gap-2">
              <mat-icon>photo_camera</mat-icon> Profile Picture
            </h3>
          </div>
          <div class="p-6 flex flex-col sm:flex-row items-center gap-6">
            <div class="h-28 w-28 shrink-0 border-2 border-gray-900 rounded-sm bg-primary-100 overflow-hidden text-3xl font-black shadow-[3px_3px_0px_0px_rgba(17,24,39,1)]">
              <img *ngIf="photoPreview; else savedPhoto" [src]="photoPreview" alt="Selected profile picture preview" class="h-full w-full object-cover">
              <ng-template #savedPhoto>
                <app-captain-avatar [path]="photoPath" [userId]="currentUserId" [name]="profileForm.get('full_name')?.value"></app-captain-avatar>
              </ng-template>
            </div>
            <div class="space-y-3 flex-1 min-w-0">
              <p class="text-sm font-bold text-gray-700">Use your own photo so other officials can recognize you.</p>
              <p id="photo-help" class="text-xs text-gray-500">JPG, PNG, or WebP. Maximum 2 MB. Photos are visible to signed-in officials.</p>
              <input #photoInput type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" tabindex="-1"
                     aria-label="Choose your profile picture" aria-describedby="photo-help" (change)="selectPhoto($event)" [disabled]="photoBusy">
              <div class="flex flex-wrap gap-2">
                <button mat-stroked-button type="button" (click)="photoInput.click()" [disabled]="photoBusy" class="!border-2 !border-gray-900 !rounded-sm">
                  <mat-icon>upload</mat-icon> {{ photoPath ? 'Replace Photo' : 'Choose Photo' }}
                </button>
                <button *ngIf="selectedPhoto" mat-flat-button color="primary" type="button" (click)="uploadPhoto()" [disabled]="photoBusy">
                  {{ photoBusy ? 'Uploading...' : 'Save Photo' }}
                </button>
                <button *ngIf="selectedPhoto" mat-button type="button" (click)="discardPhoto()" [disabled]="photoBusy">Cancel</button>
                <button *ngIf="photoPath && !selectedPhoto" mat-button color="warn" type="button" (click)="removePhoto()" [disabled]="photoBusy">
                  {{ photoBusy ? 'Removing...' : 'Remove Photo' }}
                </button>
              </div>
              <p *ngIf="selectedPhoto" class="text-xs text-gray-600 truncate">{{ selectedPhoto.name }}</p>
              <p *ngIf="photoError" role="alert" class="text-sm font-bold text-red-700">{{ photoError }}</p>
              <p *ngIf="photoSuccess" role="status" class="text-sm font-bold text-green-700">{{ photoSuccess }}</p>
            </div>
          </div>
        </section>
        <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="space-y-6">
          
          <div class="relative group">
            <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
            <div class="relative bg-white border-2 border-gray-900 rounded-sm overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
              <div class="border-b-2 border-gray-900 bg-gray-50 p-4">
                <h3 class="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2" style="font-family: 'Arial Black', Impact, sans-serif;">
                  <mat-icon class="text-primary-600">person</mat-icon> Personal Information
                </h3>
              </div>
              <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <mat-form-field appearance="outline" class="md:col-span-2">
                    <mat-label>Full Name</mat-label>
                    <input matInput formControlName="full_name">
                    <mat-error *ngIf="profileForm.get('full_name')?.hasError('required')">Required</mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Primary Phone</mat-label>
                    <input matInput formControlName="phone">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Occupation</mat-label>
                    <input matInput formControlName="occupation">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Civil Status</mat-label>
                    <mat-select formControlName="civil_status">
                      <mat-option value="Single">Single</mat-option>
                      <mat-option value="Married">Married</mat-option>
                      <mat-option value="Widowed">Widowed</mat-option>
                      <mat-option value="Legally Separated">Legally Separated</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
              </div>
            </div>
          </div>

          <div class="relative group">
            <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
            <div class="relative bg-white border-2 border-gray-900 rounded-sm overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
              <div class="border-b-2 border-gray-900 bg-gray-50 p-4">
                <h3 class="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2" style="font-family: 'Arial Black', Impact, sans-serif;">
                  <mat-icon class="text-primary-600">home</mat-icon> Address & Emergency
                </h3>
              </div>
              <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <mat-form-field appearance="outline">
                    <mat-label>Assigned Barangay</mat-label>
                    <input matInput formControlName="barangay">
                    <mat-hint class="text-[10px] font-bold text-gray-500">
                      Assigned by Municipal Admin. Cannot be changed.
                    </mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Street Address</mat-label>
                    <input matInput formControlName="street_address">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Emergency Contact Name</mat-label>
                    <input matInput formControlName="emergency_contact_name">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Emergency Contact Number</mat-label>
                    <input matInput formControlName="emergency_contact_number">
                  </mat-form-field>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="errorMsg" class="bg-red-50 text-red-700 p-4 rounded-sm border-2 border-red-200 flex items-center gap-2 font-bold uppercase tracking-wider text-xs">
            <mat-icon>error</mat-icon> {{ errorMsg }}
          </div>
          <div *ngIf="successMsg" class="bg-green-50 text-green-700 p-4 rounded-sm border-2 border-green-200 flex items-center gap-2 font-bold uppercase tracking-wider text-xs">
            <mat-icon>check_circle</mat-icon> {{ successMsg }}
          </div>

          <div class="flex justify-end mt-8">
            <button mat-flat-button color="primary" type="submit" [disabled]="profileForm.invalid || saving" class="!h-12 !px-8 !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider">
              <mat-icon *ngIf="saving" class="animate-spin mr-2">autorenew</mat-icon>
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>

        </form>
      </ng-container>
    </div>
  `,
  styles: [`
    mat-form-field { width: 100%; }
  `]
})
export class CaptainProfileComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private supabaseService = inject(SupabaseService);
  private photos = inject(CaptainPhotosService);

  photoPath: string | null = null;
  photoPreview: string | null = null;
  selectedPhoto: File | null = null;
  photoBusy = false;
  photoError = '';
  photoSuccess = '';

  selectPhoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.photoBusy) return;
    this.photoError = '';
    this.photoSuccess = '';
    try {
      this.photos.validate(file);
      this.discardPhoto();
      this.selectedPhoto = file;
      this.photoPreview = URL.createObjectURL(file);
    } catch (err: any) {
      this.photoError = err.message;
    }
  }

  discardPhoto() {
    if (this.photoPreview) URL.revokeObjectURL(this.photoPreview);
    this.photoPreview = null;
    this.selectedPhoto = null;
  }

  async uploadPhoto() {
    if (!this.selectedPhoto || this.photoBusy) return;
    this.photoBusy = true;
    this.photoError = '';
    this.photoSuccess = '';
    try {
      this.photoPath = await this.photos.upload(this.selectedPhoto, this.photoPath);
      this.discardPhoto();
      this.photoSuccess = 'Profile picture saved.';
    } catch (err: any) {
      this.photoError = err.message || 'Could not upload your photo. Please try again.';
    } finally {
      this.photoBusy = false;
    }
  }

  async removePhoto() {
    if (!this.photoPath || this.photoBusy) return;
    this.photoBusy = true;
    this.photoError = '';
    this.photoSuccess = '';
    try {
      await this.photos.remove(this.photoPath);
      this.photoPath = null;
      this.photoSuccess = 'Profile picture removed.';
    } catch (err: any) {
      this.photoError = err.message || 'Could not remove your photo.';
    } finally {
      this.photoBusy = false;
    }
  }

  ngOnDestroy() { this.discardPhoto(); }

  loading = true;
  saving = false;
  errorMsg = '';
  successMsg = '';
  currentUserId: string | null = null;
  barangays = MUNICIPALITY_CONFIG.barangays;

  verificationStatus = '';
  rejectionReason = '';
  
  profileForm: FormGroup = this.fb.group({
    full_name: ['', Validators.required],
    phone: [''],
    occupation: [''],
    civil_status: [''],
    barangay: [{value: '', disabled: true}, Validators.required],
    street_address: [''],
    emergency_contact_name: [''],
    emergency_contact_number: ['']
  });

  async ngOnInit() {
    const { data: { user } } = await this.supabaseService.supabase.auth.getUser();
    if (user) {
      this.currentUserId = user.id;
      this.loadProfile();
    } else {
      this.loading = false;
      this.errorMsg = 'Sign in again to manage your profile.';
    }
  }

  async loadProfile() {
    if (!this.currentUserId) return;
    
    const { data, error } = await this.supabaseService.supabase
      .from('users')
      .select('*')
      .eq('id', this.currentUserId)
      .single();

    if (!error && data) {
      this.photoPath = data.profile_picture_path ?? null;
      this.verificationStatus = data.verification_status;
      this.rejectionReason = data.rejection_reason;
      
      this.profileForm.patchValue({
        full_name: data.full_name,
        phone: data.phone,
        occupation: data.occupation,
        civil_status: data.civil_status,
        barangay: data.barangay,
        street_address: data.street_address,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_number: data.emergency_contact_number
      });
    }
    this.loading = false;
  }

  async onSubmit() {
    if (this.profileForm.invalid || !this.currentUserId) return;
    
    this.saving = true;
    this.errorMsg = '';
    this.successMsg = '';

    const updates = this.profileForm.value;

    try {
      const { error } = await this.supabaseService.supabase
        .from('users')
        .update(updates)
        .eq('id', this.currentUserId);

      if (error) throw error;

      this.successMsg = 'Profile updated successfully!';
      setTimeout(() => this.successMsg = '', 4000);

    } catch (err: any) {
      this.errorMsg = err.message || 'Failed to update profile.';
    } finally {
      this.saving = false;
    }
  }
}
