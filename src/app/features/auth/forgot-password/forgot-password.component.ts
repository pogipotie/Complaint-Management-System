import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="relative bg-white rounded-sm overflow-hidden border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] flex flex-col w-full mx-auto">
      
      <!-- Form Container -->
      <div class="w-full p-6 sm:p-10 flex flex-col justify-center bg-white">
        
        <!-- Header -->
        <div class="flex flex-col items-center mb-8 pt-4">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4 border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
            <mat-icon class="text-primary-600 scale-125">lock_reset</mat-icon>
          </div>
          <h2 class="text-2xl font-black text-gray-900 tracking-tight uppercase" style="font-family: 'Arial Black', Impact, sans-serif;">Reset Password</h2>
          <p class="text-sm font-bold text-gray-600 uppercase tracking-widest mt-2 text-center">
            Enter your email to receive a password reset link.
          </p>
        </div>

        <div *ngIf="successMsg" class="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-sm text-center">
          <mat-icon class="text-green-500 mb-2 scale-150">mark_email_read</mat-icon>
          <p class="text-sm font-bold text-gray-800">{{ successMsg }}</p>
          <button mat-button color="primary" class="mt-4 font-bold uppercase tracking-wider text-xs" (click)="closeDialog()">Return to Login</button>
        </div>

        <form *ngIf="!successMsg" class="space-y-5" [formGroup]="forgotForm" (ngSubmit)="onSubmit()">
          <div>
            <label class="block text-[11px] font-black uppercase tracking-widest text-gray-700 mb-1">Email Address</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <mat-icon class="text-gray-400 scale-90">email</mat-icon>
              </div>
              <input formControlName="email" type="email" autocomplete="email" placeholder="e.g. juan@example.com"
                class="w-full pl-10 pr-4 py-3 rounded-sm border-2 border-gray-900 focus:ring-0 focus:border-primary-600 outline-none transition-colors bg-gray-50 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
            </div>
            <div class="text-red-500 font-bold uppercase tracking-wider text-[10px] mt-1" *ngIf="forgotForm.get('email')?.touched && forgotForm.get('email')?.hasError('required')">Email is required</div>
            <div class="text-red-500 font-bold uppercase tracking-wider text-[10px] mt-1" *ngIf="forgotForm.get('email')?.touched && forgotForm.get('email')?.hasError('email')">Please enter a valid email</div>
          </div>

          <div class="text-red-700 bg-red-50 p-3 rounded-sm border-2 border-red-200 flex items-start gap-2 font-bold uppercase tracking-wider text-[10px]" *ngIf="errorMsg">
            <mat-icon class="scale-75 text-red-500 shrink-0">error</mat-icon>
            <span class="mt-0.5">{{ errorMsg }}</span>
          </div>

          <div class="flex flex-col gap-3 pt-4">
            <button mat-flat-button color="primary" type="submit" [disabled]="forgotForm.invalid || loading" class="w-full !h-12 !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider">
              <mat-icon *ngIf="loading" class="animate-spin mr-2">autorenew</mat-icon>
              {{ loading ? 'Sending...' : 'Send Reset Link' }}
            </button>
            <button mat-button type="button" (click)="closeDialog()" [disabled]="loading" class="w-full !h-12 !rounded-sm font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  public dialogRef = inject(MatDialogRef<ForgotPasswordComponent>, { optional: true });

  forgotForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  loading = false;
  errorMsg = '';
  successMsg = '';

  closeDialog() {
    if (this.dialogRef) {
      this.dialogRef.close('cancel');
    }
  }

  async onSubmit() {
    if (this.forgotForm.invalid) return;
    this.loading = true;
    this.errorMsg = '';
    
    const email = this.forgotForm.value.email;
    
    try {
      // 1. Check if the email actually exists in our system
      const exists = await this.authService.checkEmailExists(email);
      
      if (!exists) {
        this.loading = false;
        this.errorMsg = 'No account found with this email address.';
        return;
      }

      // 2. If it exists, proceed to send the reset link
      this.authService.resetPasswordForEmail(email).subscribe({
        next: ({ error }) => {
          this.loading = false;
          if (error) {
            this.errorMsg = error.message;
          } else {
            this.successMsg = 'Check your email for a password reset link. It might take a few minutes to arrive.';
          }
        },
        error: (err) => {
          this.loading = false;
          this.errorMsg = err.message || 'An unexpected error occurred.';
        }
      });
      
    } catch (err: any) {
      this.loading = false;
      this.errorMsg = 'Failed to verify email. Please try again.';
    }
  }
}