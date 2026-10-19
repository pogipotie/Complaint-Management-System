import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SupabaseService } from '../../core/services/supabase.service';

function matchingPasswords(control: AbstractControl): ValidationErrors | null {
  return control.get('password')?.value === control.get('confirmPassword')?.value
    ? null : { mismatch: true };
}

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="max-w-3xl mx-auto space-y-6 pb-12">
      <header>
        <h2 class="text-3xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
          <mat-icon class="text-primary-600">manage_accounts</mat-icon> Admin Profile
        </h2>
        <p class="mt-2 text-sm font-bold text-gray-600">Manage your contact details and account password.</p>
      </header>

      <p *ngIf="loading" role="status" class="p-6 text-center font-bold">Loading your profile...</p>
      <div *ngIf="loadError" role="alert" class="border-2 border-red-700 bg-red-50 p-4 text-red-700">
        {{ loadError }}
        <button mat-button type="button" (click)="loadProfile()" [disabled]="loading">Retry</button>
      </div>

      <ng-container *ngIf="!loading && userId">
        <section class="profile-panel" aria-labelledby="account-heading">
          <h3 id="account-heading" class="panel-heading"><mat-icon>verified_user</mat-icon> Account Details</h3>
          <dl class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><dt class="text-gray-500 font-bold">Email</dt><dd class="break-all">{{ email }}</dd></div>
            <div><dt class="text-gray-500 font-bold">Role</dt><dd>Administrator</dd></div>
            <div><dt class="text-gray-500 font-bold">Verification</dt><dd class="capitalize">{{ verification }}</dd></div>
            <div><dt class="text-gray-500 font-bold">Account Status</dt><dd>{{ active ? 'Active' : 'Inactive' }}</dd></div>
          </dl>
        </section>

        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="profile-panel" aria-labelledby="personal-heading">
          <h3 id="personal-heading" class="panel-heading"><mat-icon>person</mat-icon> Personal & Contact Information</h3>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <mat-form-field appearance="outline" class="sm:col-span-2">
                <mat-label>Full Name</mat-label>
                <input matInput formControlName="full_name" autocomplete="name">
                <mat-error *ngIf="profileForm.get('full_name')?.invalid">Enter your full name.</mat-error>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Phone</mat-label><input matInput formControlName="phone" type="tel" autocomplete="tel">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Occupation</mat-label><input matInput formControlName="occupation">
              </mat-form-field>
              <mat-form-field appearance="outline" class="sm:col-span-2">
                <mat-label>Street Address</mat-label><input matInput formControlName="street_address" autocomplete="street-address">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Emergency Contact Name</mat-label><input matInput formControlName="emergency_contact_name">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Emergency Contact Number</mat-label><input matInput formControlName="emergency_contact_number" type="tel">
              </mat-form-field>
            </div>
            <p *ngIf="profileError" role="alert" class="text-red-700 font-bold">{{ profileError }}</p>
            <p *ngIf="profileSuccess" role="status" class="text-green-700 font-bold">{{ profileSuccess }}</p>
            <div class="flex justify-end">
              <button mat-flat-button color="primary" type="submit" [disabled]="profileForm.invalid || savingProfile">
                {{ savingProfile ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </form>

        <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="profile-panel" aria-labelledby="password-heading">
          <h3 id="password-heading" class="panel-heading"><mat-icon>lock</mat-icon> Change Password</h3>
          <div class="p-6 space-y-4">
            <p class="text-sm text-gray-600">Use a unique password with at least 12 characters. Supabase may require you to sign in again.</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <mat-form-field appearance="outline">
                <mat-label>New Password</mat-label>
                <input matInput type="password" formControlName="password" autocomplete="new-password">
                <mat-error *ngIf="passwordForm.get('password')?.invalid">Use at least 12 characters and at most 72 bytes.</mat-error>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Confirm Password</mat-label>
                <input matInput type="password" formControlName="confirmPassword" autocomplete="new-password">
                <mat-error *ngIf="passwordForm.get('confirmPassword')?.invalid">Confirm your password.</mat-error>
              </mat-form-field>
            </div>
            <p *ngIf="passwordForm.hasError('mismatch') && passwordForm.get('confirmPassword')?.touched" role="alert" class="text-red-700">Passwords do not match.</p>
            <p *ngIf="passwordError" role="alert" class="text-red-700 font-bold">{{ passwordError }}</p>
            <p *ngIf="passwordSuccess" role="status" class="text-green-700 font-bold">{{ passwordSuccess }}</p>
            <div class="flex justify-end">
              <button mat-flat-button color="primary" type="submit" [disabled]="passwordForm.invalid || savingPassword">
                {{ savingPassword ? 'Updating...' : 'Update Password' }}
              </button>
            </div>
          </div>
        </form>
      </ng-container>
    </div>
  `,
  styles: [`
    mat-form-field { width: 100%; }
    .profile-panel { background: white; border: 2px solid #111827; border-radius: 4px; box-shadow: 4px 4px 0 #111827; }
    .panel-heading { display: flex; align-items: center; gap: 8px; padding: 16px; background: #f9fafb; border-bottom: 2px solid #111827; font-weight: 900; text-transform: uppercase; letter-spacing: .05em; }
    button[type=submit] { border: 2px solid #111827; border-radius: 4px; box-shadow: 2px 2px 0 #111827; }
  `]
})
export class AdminProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService).supabase;
  loading = true;
  userId: string | null = null;
  email = '';
  verification = '';
  active = false;
  loadError = '';
  profileError = '';
  profileSuccess = '';
  passwordError = '';
  passwordSuccess = '';
  savingProfile = false;
  savingPassword = false;

  profileForm = this.fb.nonNullable.group({
    full_name: ['', [Validators.required, Validators.pattern(/\S/)]],
    phone: [''], occupation: [''], street_address: [''],
    emergency_contact_name: [''], emergency_contact_number: ['']
  });
  passwordForm = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(12),
      (control: AbstractControl) => new TextEncoder().encode(control.value || '').length > 72 ? { tooLong: true } : null]],
    confirmPassword: ['', Validators.required]
  }, { validators: matchingPasswords });

  ngOnInit() { void this.loadProfile(); }

  async loadProfile() {
    this.loading = true;
    this.loadError = '';
    this.userId = null;
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Sign in again to access your admin profile.');
      const { data, error } = await this.supabase.from('users')
        .select('role, full_name, phone, occupation, street_address, emergency_contact_name, emergency_contact_number, verification_status, is_active')
        .eq('id', user.id).single();
      if (error) throw error;
      if (!data || data.role !== 'admin') throw new Error('This page is available only to administrators.');
      this.email = user.email ?? '';
      this.verification = data.verification_status;
      this.active = data.is_active;
      for (const key of Object.keys(this.profileForm.controls) as Array<keyof typeof this.profileForm.controls>) {
        this.profileForm.controls[key].setValue(data[key] ?? '');
      }
      this.userId = user.id;
    } catch (err: any) {
      this.loadError = err.message || 'Could not load your admin profile.';
    } finally {
      this.loading = false;
    }
  }

  async saveProfile() {
    if (!this.userId || this.profileForm.invalid || this.savingProfile) return;
    this.savingProfile = true;
    this.profileError = '';
    this.profileSuccess = '';
    try {
      // Only these editable contact fields are sent; never role or verification.
      const updates = this.profileForm.getRawValue();
      updates.full_name = updates.full_name.trim();
      const { error } = await this.supabase.from('users').update(updates)
        .eq('id', this.userId).eq('role', 'admin').select('id').single();
      if (error) throw error;
      this.profileSuccess = 'Profile updated successfully.';
    } catch (err: any) {
      this.profileError = err.message || 'Could not save your profile.';
    } finally {
      this.savingProfile = false;
    }
  }

  async changePassword() {
    if (!this.userId || this.passwordForm.invalid || this.savingPassword) return;
    this.savingPassword = true;
    this.passwordError = '';
    this.passwordSuccess = '';
    try {
      const { error } = await this.supabase.auth.updateUser({ password: this.passwordForm.controls.password.value });
      if (error) throw error;
      this.passwordForm.reset();
      this.passwordSuccess = 'Password updated successfully.';
    } catch (err: any) {
      this.passwordError = err.message || 'Could not update your password. Try signing in again.';
    } finally {
      this.savingPassword = false;
    }
  }
}
