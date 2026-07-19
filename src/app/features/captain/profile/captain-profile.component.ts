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
export class CaptainProfileComponent implements OnInit {
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
