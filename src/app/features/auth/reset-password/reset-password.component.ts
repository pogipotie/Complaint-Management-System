import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div class="max-w-md w-full mx-auto space-y-8">
        
        <!-- Header -->
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] mb-4">
            <mat-icon color="primary" class="scale-150">vpn_key</mat-icon>
          </div>
          <h2 class="text-3xl font-black text-gray-900 uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">
            Set New Password
          </h2>
          <p class="text-sm font-bold text-gray-600 uppercase tracking-wider">
            Please enter your new password below.
          </p>
        </div>

        <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="bg-white rounded-sm overflow-hidden border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] p-8 sm:p-10 space-y-5">
          
          <div *ngIf="successMsg" class="p-4 bg-green-50 border-2 border-green-200 rounded-sm text-center mb-6">
            <mat-icon class="text-green-500 mb-2 scale-150">check_circle</mat-icon>
            <p class="text-sm font-bold text-gray-800">{{ successMsg }}</p>
            <button mat-button color="primary" class="mt-4 font-bold uppercase tracking-wider text-xs" routerLink="/?action=login">Proceed to Login</button>
          </div>

          <ng-container *ngIf="!successMsg">
            <div>
              <label class="block text-[11px] font-black uppercase tracking-widest text-gray-700 mb-1">New Password</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <mat-icon class="text-gray-400 scale-90">lock</mat-icon>
                </div>
                <input [type]="hidePassword ? 'password' : 'text'" formControlName="password"
                  class="w-full pl-10 pr-10 py-3 rounded-sm border-2 border-gray-900 focus:ring-0 focus:border-primary-600 outline-none transition-colors bg-gray-50 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                <div class="absolute inset-y-0 right-0 pr-2 flex items-center">
                  <button type="button" (click)="hidePassword = !hidePassword" class="p-1 text-gray-400 hover:text-gray-900 focus:outline-none transition-colors">
                    <mat-icon class="scale-90">{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                  </button>
                </div>
              </div>
              <div class="text-red-500 font-bold uppercase tracking-wider text-[10px] mt-1" *ngIf="resetForm.get('password')?.touched && resetForm.get('password')?.hasError('required')">Password is required</div>
              <div class="text-red-500 font-bold uppercase tracking-wider text-[10px] mt-1" *ngIf="resetForm.get('password')?.touched && resetForm.get('password')?.hasError('minlength')">Must be at least 6 characters</div>
            </div>

            <div>
              <label class="block text-[11px] font-black uppercase tracking-widest text-gray-700 mb-1">Confirm New Password</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <mat-icon class="text-gray-400 scale-90">lock_clock</mat-icon>
                </div>
                <input [type]="hideConfirmPassword ? 'password' : 'text'" formControlName="confirmPassword"
                  class="w-full pl-10 pr-10 py-3 rounded-sm border-2 border-gray-900 focus:ring-0 focus:border-primary-600 outline-none transition-colors bg-gray-50 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                <div class="absolute inset-y-0 right-0 pr-2 flex items-center">
                  <button type="button" (click)="hideConfirmPassword = !hideConfirmPassword" class="p-1 text-gray-400 hover:text-gray-900 focus:outline-none transition-colors">
                    <mat-icon class="scale-90">{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                  </button>
                </div>
              </div>
              <div class="text-red-500 font-bold uppercase tracking-wider text-[10px] mt-1" *ngIf="resetForm.get('confirmPassword')?.touched && resetForm.get('confirmPassword')?.hasError('required')">Please confirm your password</div>
              <div class="text-red-500 font-bold uppercase tracking-wider text-[10px] mt-1" *ngIf="resetForm.get('confirmPassword')?.touched && resetForm.hasError('mismatch')">Passwords do not match</div>
            </div>

            <div class="text-red-700 bg-red-50 p-3 rounded-sm border-2 border-red-200 flex items-start gap-2 font-bold uppercase tracking-wider text-[10px]" *ngIf="errorMsg">
              <mat-icon class="scale-75 text-red-500 shrink-0">error</mat-icon>
              <span class="mt-0.5">{{ errorMsg }}</span>
            </div>

            <button mat-flat-button color="primary" type="submit" [disabled]="resetForm.invalid || loading" class="w-full !h-12 !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider mt-4">
              <mat-icon *ngIf="loading" class="animate-spin mr-2">autorenew</mat-icon>
              {{ loading ? 'Saving...' : 'Update Password' }}
            </button>
          </ng-container>

        </form>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  hidePassword = true;
  hideConfirmPassword = true;
  loading = false;
  errorMsg = '';
  successMsg = '';

  resetForm: FormGroup = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  ngOnInit() {
    // When the user arrives here via the email link, Supabase will parse the URL hash
    // and establish a session. If there's an error (e.g. link expired), it's available in the hash.
    const hash = window.location.hash;
    if (hash && hash.includes('error_description=')) {
      const params = new URLSearchParams(hash.replace('#', '?'));
      this.errorMsg = decodeURIComponent(params.get('error_description') || 'Invalid or expired reset link.');
    }
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.resetForm.invalid) return;
    this.loading = true;
    this.errorMsg = '';
    
    const newPassword = this.resetForm.value.password;
    
    this.authService.updateUserPassword(newPassword).subscribe({
      next: ({ error }) => {
        this.loading = false;
        if (error) {
          this.errorMsg = error.message;
        } else {
          this.successMsg = 'Your password has been successfully updated.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.message || 'An unexpected error occurred.';
      }
    });
  }
}