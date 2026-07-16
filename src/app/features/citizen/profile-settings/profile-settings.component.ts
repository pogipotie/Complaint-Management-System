import { Component, inject, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule
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
                    <mat-label>Barangay</mat-label>
                    <mat-select formControlName="barangay">
                      <mat-option *ngFor="let brgy of barangays" [value]="brgy">{{ brgy }}</mat-option>
                    </mat-select>
                    <mat-hint *ngIf="verificationStatus === 'verified'" class="text-[10px] font-bold text-gray-500">
                      Cannot be changed after verification.
                    </mat-hint>
                    <mat-error *ngIf="profileForm.get('barangay')?.hasError('required')">Required</mat-error>
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

          <div class="relative group">
            <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
            <div class="relative bg-white border-2 border-gray-900 rounded-sm overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
              <div class="border-b-2 border-gray-900 bg-gray-50 p-4">
                <h3 class="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2" style="font-family: 'Arial Black', Impact, sans-serif;">
                  <mat-icon class="text-primary-600">badge</mat-icon> Verification ID
                </h3>
              </div>
              <div class="p-6">
                <div *ngIf="verificationStatus === 'banned'" class="mb-4 bg-gray-800 border-2 border-gray-900 p-4 rounded-sm shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                  <p class="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2 mb-1">
                    <mat-icon>block</mat-icon> Account Banned
                  </p>
                  <p class="text-xs font-bold text-gray-300">Reason: {{ rejectionReason || 'Violation of community guidelines.' }}</p>
                  <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-2">This account has been permanently suspended and cannot be used to submit further complaints.</p>
                </div>

                <div *ngIf="verificationStatus === 'rejected'" class="mb-4 bg-red-50 border-2 border-gray-900 p-4 rounded-sm shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                  <p class="text-sm font-black text-red-700 uppercase tracking-tight flex items-center gap-2 mb-1">
                    <mat-icon>error_outline</mat-icon> Registration Rejected
                  </p>
                  <p class="text-xs font-bold text-gray-700">Reason: {{ rejectionReason || 'No reason provided.' }}</p>
                  <p class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-2">Please upload a clear, updated ID or correct your information above to automatically resubmit your registration.</p>
                </div>
                
                <div class="space-y-3" *ngIf="verificationStatus !== 'banned'">
                  <label class="text-sm font-medium text-gray-700 block">
                    {{ verificationStatus === 'verified' ? 'Verified Proof of Residency' : 'Update Proof of Residency (Optional)' }}
                  </label>
                  
                  <!-- Verified State (Read-Only) -->
                  <div *ngIf="verificationStatus === 'verified'" class="h-[150px] flex items-center justify-between p-4 border-2 border-gray-900 bg-white shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] rounded-sm">
                    <div class="flex items-center gap-4">
                      <img *ngIf="currentIdUrl" [src]="currentIdUrl" class="w-20 h-20 rounded-sm object-cover border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]" alt="ID Preview">
                      <div class="flex flex-col">
                        <span class="text-[10px] font-black uppercase tracking-widest text-green-700 bg-green-100 border-2 border-green-700 px-2 py-0.5 rounded-sm inline-block w-max mb-1">
                          <mat-icon class="scale-[0.6] -ml-1 mr-0.5 inline-block align-bottom">verified</mat-icon> Verified
                        </span>
                        <p class="text-[10px] text-gray-500 font-bold uppercase tracking-wider max-w-[200px]">Your ID is verified and cannot be changed.</p>
                      </div>
                    </div>
                  </div>

                  <!-- Pending/Rejected State (Uploadable) -->
                  <div *ngIf="verificationStatus !== 'verified'" class="upload-dropzone h-[150px] flex flex-col justify-center border-2 border-dashed border-gray-900 bg-gray-50 hover:bg-primary-50 hover:border-primary-600 transition-colors relative cursor-pointer" 
                       [class.border-solid]="!!selectedFile || currentIdUrl"
                       [class.bg-white]="!!selectedFile || currentIdUrl"
                       (click)="!selectedFile ? fileInput.click() : null">
                    
                    <input type="file" #fileInput class="hidden" accept="image/jpeg, image/png, image/webp" capture="environment" (change)="onFileSelected($event)">
                    
                    <ng-container *ngIf="!selectedFile && !currentIdUrl">
                      <mat-icon class="mx-auto text-gray-400 scale-[1.5] mb-2">cloud_upload</mat-icon>
                      <div class="text-sm text-gray-600 font-bold uppercase tracking-wider text-center">Click to Upload New ID</div>
                    </ng-container>

                    <ng-container *ngIf="selectedFile || currentIdUrl">
                      <div class="flex items-center justify-between p-4 w-full h-full">
                        <img [src]="imagePreviewUrl || currentIdUrl" class="w-20 h-20 rounded-sm object-cover border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]" alt="ID Preview">
                        <div class="flex flex-col items-end gap-2">
                          <span class="text-[10px] font-black uppercase tracking-widest text-primary-600 border border-primary-200 bg-primary-50 px-2 py-0.5 rounded-sm">
                            {{ selectedFile ? 'New ID Selected' : 'Current ID' }}
                          </span>
                          <button mat-stroked-button type="button" (click)="removeFile($event); fileInput.click()" color="primary" class="scale-90 !rounded-sm !border-2 !border-gray-900 !shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-none transition-all font-black uppercase tracking-wider">
                            Change File
                          </button>
                        </div>
                      </div>
                    </ng-container>
                  </div>
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

          <div class="flex justify-end mt-8" *ngIf="verificationStatus !== 'banned'">
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
export class ProfileSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private supabaseService = inject(SupabaseService);

  loading = true;
  saving = false;
  errorMsg = '';
  successMsg = '';
  currentUserId: string | null = null;
  barangays = MUNICIPALITY_CONFIG.barangays;

  verificationStatus = '';
  rejectionReason = '';
  
  selectedFile: File | null = null;
  imagePreviewUrl: string | ArrayBuffer | null = null;
  currentIdUrl: string | null = null;

  profileForm: FormGroup = this.fb.group({
    full_name: ['', Validators.required],
    phone: [''],
    occupation: [''],
    civil_status: [''],
    barangay: ['', Validators.required],
    street_address: [''],
    emergency_contact_name: [''],
    emergency_contact_number: ['']
  });

  async ngOnInit() {
    const { data: { user } } = await this.supabaseService.supabase.auth.getUser();
    if (user) {
      this.currentUserId = user.id;
      this.loadProfile();
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

      if (this.verificationStatus === 'verified') {
        this.profileForm.get('barangay')?.disable();
      } else {
        this.profileForm.get('barangay')?.enable();
      }

      // Fetch signed URL if an ID exists
      if (data.proof_of_residency_url) {
        let path = data.proof_of_residency_url;
        if (path.includes('citizen_ids/')) {
          path = path.split('citizen_ids/')[1].split('?')[0];
        }
        const { data: signedUrlData } = await this.supabaseService.supabase.storage
          .from('citizen_ids')
          .createSignedUrl(path, 600);
        
        if (signedUrlData?.signedUrl) {
          this.currentIdUrl = signedUrlData.signedUrl;
        }
      }
    }
    this.loading = false;
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      try {
        const compressedFile = await this.compressImage(file);
        this.selectedFile = compressedFile;
        const reader = new FileReader();
        reader.onload = e => this.imagePreviewUrl = reader?.result ?? null;
        reader.readAsDataURL(compressedFile);
      } catch (err) {
        this.errorMsg = 'Failed to process image.';
      }
    }
  }

  removeFile(event: Event) {
    event.stopPropagation();
    this.selectedFile = null;
    this.imagePreviewUrl = null;
  }

  compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width, height = img.height;
          const MAX = 1200;
          if (width > height) { if (width > MAX) { height *= MAX / width; width = MAX; } } 
          else { if (height > MAX) { width *= MAX / height; height = MAX; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas ctx not found'));
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Canvas to Blob failed'));
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".jpeg"), { type: 'image/jpeg', lastModified: Date.now() }));
          }, 'image/jpeg', 0.7);
        };
      };
    });
  }

  async onSubmit() {
    if (this.profileForm.invalid || !this.currentUserId) return;
    
    this.saving = true;
    this.errorMsg = '';
    this.successMsg = '';

    const updates = this.profileForm.value;

    // If user is currently rejected, resubmit their status to pending
    if (this.verificationStatus === 'rejected') {
      updates.verification_status = 'pending';
      updates.rejection_reason = null;
    }

    try {
      // If they selected a new ID, upload it first
      if (this.selectedFile) {
        const filePath = `${this.currentUserId}/${Date.now()}.jpeg`;
        const { error: uploadError } = await this.supabaseService.supabase.storage
          .from('citizen_ids')
          .upload(filePath, this.selectedFile);
          
        if (uploadError) throw uploadError;
        
        updates.proof_of_residency_url = filePath;
      }

      const { error } = await this.supabaseService.supabase
        .from('users')
        .update(updates)
        .eq('id', this.currentUserId);

      if (error) throw error;

      this.successMsg = 'Profile updated successfully!';
      
      // Update local state if they resubmitted
      if (this.verificationStatus === 'rejected') {
        this.verificationStatus = 'pending';
        this.rejectionReason = '';
        this.successMsg = 'Profile updated and registration resubmitted for review!';
      }

      this.selectedFile = null;
      setTimeout(() => this.successMsg = '', 4000);

    } catch (err: any) {
      this.errorMsg = err.message || 'Failed to update profile.';
    } finally {
      this.saving = false;
    }
  }
}
