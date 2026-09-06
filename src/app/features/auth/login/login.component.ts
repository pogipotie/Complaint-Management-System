import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ForgotPasswordComponent } from '../forgot-password/forgot-password.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <div class="relative bg-white rounded-sm overflow-hidden border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] flex flex-col sm:flex-row w-full max-w-4xl mx-auto">

      <!-- Left Side / Branding (Hidden on small mobile) -->
      <div class="hidden sm:flex sm:w-5/12 bg-primary-600 p-8 flex-col justify-center relative overflow-hidden text-center">
        <!-- Pineapple body pattern: diamond grid with star-burst scales -->
        <div class="absolute inset-0 opacity-50 pointer-events-none"
             style="background-image: url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='%23fbbf24' stroke-width='0.7' opacity='0.7'><path d='M20 0 L40 20 L20 40 L0 20 Z'/><path d='M0 0 L20 20 L40 0'/><path d='M0 40 L20 20 L40 40'/></g><g fill='%23fde047'><path d='M20 20 L17 12 L23 12 Z'/><path d='M20 20 L28 17 L28 23 Z'/><path d='M20 20 L23 28 L17 28 Z'/><path d='M20 20 L12 23 L12 17 Z'/><circle cx='20' cy='20' r='1.4' fill='%23a16207'/></g></svg>&quot;); background-size: 40px 40px;">
        </div>

        <!-- Pineapple leaves / crown at the top -->
        <svg class="absolute top-0 left-1/2 -translate-x-1/2 -mt-1 w-48 h-28 opacity-90 pointer-events-none" viewBox="0 0 240 140" preserveAspectRatio="xMidYMin meet">
          <!-- Outer leaves (darker green) -->
          <path d="M120 140 C 80 110 40 90 10 30 C 60 50 95 80 120 130 Z" fill="#15803d"/>
          <path d="M120 140 C 160 110 200 90 230 30 C 180 50 145 80 120 130 Z" fill="#15803d"/>
          <!-- Mid leaves -->
          <path d="M120 140 C 95 100 75 60 55 5 C 95 40 115 80 120 130 Z" fill="#16a34a"/>
          <path d="M120 140 C 145 100 165 60 185 5 C 145 40 125 80 120 130 Z" fill="#16a34a"/>
          <!-- Inner leaves (lighter green) -->
          <path d="M120 140 C 108 90 100 50 90 0 C 110 30 118 70 120 130 Z" fill="#22c55e"/>
          <path d="M120 140 C 132 90 140 50 150 0 C 130 30 122 70 120 130 Z" fill="#22c55e"/>
          <!-- Center leaf -->
          <path d="M120 140 C 114 90 112 50 115 5 C 122 50 124 90 120 130 Z" fill="#4ade80"/>
          <!-- Leaf veins (subtle highlights) -->
          <path d="M120 135 Q 90 80 30 40" stroke="#bbf7d0" stroke-width="1" fill="none" opacity="0.6"/>
          <path d="M120 135 Q 150 80 210 40" stroke="#bbf7d0" stroke-width="1" fill="none" opacity="0.6"/>
          <path d="M120 135 Q 105 70 80 10" stroke="#bbf7d0" stroke-width="1" fill="none" opacity="0.5"/>
          <path d="M120 135 Q 135 70 160 10" stroke="#bbf7d0" stroke-width="1" fill="none" opacity="0.5"/>
        </svg>

        <div class="relative z-10 flex flex-col items-center">
          <div class="inline-flex items-center justify-center w-28 h-28 rounded-full bg-white border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] mb-6 p-2">
            <img src="homapage/logo.png" alt="Bayan ng Gonzaga Seal" class="w-full h-full object-contain">
          </div>
          <p class="text-white text-base sm:text-lg leading-relaxed font-black uppercase tracking-wider px-4 py-3 border-2 border-yellow-300 bg-green-900/40 rounded-sm backdrop-blur-sm" style="font-family: 'Arial Black', Impact, sans-serif; text-shadow: 1px 1px 0 #14532d, -1px 1px 0 #14532d, 1px -1px 0 #14532d, -1px -1px 0 #14532d, 0 2px 4px rgba(0,0,0,0.5);">
            Sign in to track your reported issues, communicate with local officials, and stay updated with your community.
          </p>
        </div>
      </div>

      <!-- Right Side / Form -->
      <div class="w-full sm:w-7/12 p-6 sm:p-10 flex flex-col justify-center bg-white">

        <!-- Mobile Logo Header (Only visible on small screens) -->
        <div class="sm:hidden flex flex-col items-center mb-8 pt-4">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-3 shadow-sm border-2 border-gray-900 p-1">
            <img src="homapage/logo.png" alt="Bayan ng Gonzaga Seal" class="w-full h-full object-contain">
          </div>
          <h2 class="text-xl font-bold text-gray-900 tracking-tight">Municipality Portal</h2>
        </div>

        <div class="mb-6 sm:mb-8 text-center sm:text-left border-b-2 border-gray-900 pb-4">
          <h3 class="text-3xl font-black text-gray-900 tracking-tight uppercase" style="font-family: 'Arial Black', Impact, sans-serif;">Sign In</h3>
          <p class="text-sm font-bold text-gray-600 uppercase tracking-widest mt-2">Enter your credentials to access your account.</p>
        </div>

        <form class="space-y-4 sm:space-y-5" [formGroup]="loginForm" (ngSubmit)="onSubmit()">

          <div class="space-y-4">
            <div>
              <label class="block text-[11px] font-black uppercase tracking-widest text-gray-700 mb-1">Email Address</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <mat-icon class="text-gray-400 scale-90">email</mat-icon>
                </div>
                <input formControlName="email" type="email" autocomplete="email" placeholder="e.g. juan@example.com"
                  class="w-full pl-10 pr-4 py-3 rounded-sm border-2 border-gray-900 focus:ring-0 focus:border-primary-600 outline-none transition-colors bg-gray-50 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
              </div>
              <div class="text-red-500 font-bold uppercase tracking-wider text-[10px] mt-1" *ngIf="loginForm.get('email')?.touched && loginForm.get('email')?.hasError('required')">Email is required</div>
              <div class="text-red-500 font-bold uppercase tracking-wider text-[10px] mt-1" *ngIf="loginForm.get('email')?.touched && loginForm.get('email')?.hasError('email')">Please enter a valid email</div>
            </div>

            <div>
              <label class="block text-[11px] font-black uppercase tracking-widest text-gray-700 mb-1">Password</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <mat-icon class="text-gray-400 scale-90">lock</mat-icon>
                </div>
                <input [type]="hidePassword ? 'password' : 'text'" formControlName="password" autocomplete="current-password"
                  class="w-full pl-10 pr-10 py-3 rounded-sm border-2 border-gray-900 focus:ring-0 focus:border-primary-600 outline-none transition-colors bg-gray-50 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                <div class="absolute inset-y-0 right-0 pr-2 flex items-center">
                  <button type="button" (click)="hidePassword = !hidePassword" class="p-1 text-gray-400 hover:text-gray-900 focus:outline-none transition-colors">
                    <mat-icon class="scale-90">{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                  </button>
                </div>
              </div>
              <div class="text-red-500 font-bold uppercase tracking-wider text-[10px] mt-1" *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.hasError('required')">Password is required</div>
            </div>
          </div>

          <div class="flex items-center justify-between mt-4 mb-6">
            <div class="text-[11px] font-bold tracking-wider uppercase">
              <a href="#" class="text-primary-600 hover:text-primary-500 transition-colors" (click)="openForgotPassword($event)">
                Forgot your password?
              </a>
            </div>
          </div>

          <div class="text-red-700 bg-red-50 p-3 rounded-sm border-2 border-red-200 flex items-start gap-2 font-bold uppercase tracking-wider text-[10px]" *ngIf="errorMsg">
            <mat-icon class="scale-75 text-red-500 shrink-0">error</mat-icon>
            <span class="mt-0.5">{{ errorMsg }}</span>
          </div>

          <button mat-flat-button color="primary" type="submit" [disabled]="loginForm.invalid || loading" class="w-full !h-12 !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider mt-4">
            <mat-icon *ngIf="loading" class="animate-spin mr-2">autorenew</mat-icon>
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>

        </form>

        <div class="mt-8 text-center pb-4 sm:pb-0">
          <a routerLink="/auth/register" (click)="closeDialog()" class="font-bold text-gray-900 hover:text-primary-600 bg-white py-2 px-6 rounded-sm shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] border-2 border-gray-900 inline-block uppercase tracking-wider text-[11px] transition-colors">
            Don't have an account? Register here
          </a>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    ::ng-deep .hide-subscript .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
    ::ng-deep .hide-subscript.ng-invalid.ng-touched .mat-mdc-form-field-subscript-wrapper {
      display: flex;
      margin-top: 4px;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  public dialogRef = inject(MatDialogRef<LoginComponent>, { optional: true });
  private dialog = inject(MatDialog);

  hidePassword = true;

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  loading = false;
  errorMsg = '';

  closeDialog() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  openForgotPassword(event: Event) {
    event.preventDefault();
    this.closeDialog();
    this.dialog.open(ForgotPasswordComponent, {
      width: '95vw',
      maxWidth: '500px',
      panelClass: 'modern-dialog',
      autoFocus: false
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.errorMsg = '';

    const { email, password } = this.loginForm.value;
    this.authService.signIn(email, password).subscribe({
      next: async ({ data, error }) => {
        if (error) {
          this.loading = false;
          if (error.message.toLowerCase().includes('email not confirmed')) {
            this.errorMsg = 'Your email address is not verified. Please check your inbox or register again to receive a new OTP.';
          } else {
            this.errorMsg = error.message;
          }
        } else if (data.user) {
          try {
            const profile = await this.authService.getUserProfile(data.user.id);
            this.loading = false;

            this.closeDialog();

            if (profile) {
              if (profile.role === 'admin') {
                this.router.navigate(['/admin/dashboard']);
              } else if (profile.role === 'brgy_captain') {
                this.router.navigate(['/captain/dashboard']);
              } else {
                this.router.navigate(['/citizen/complaints']);
              }
            }
          } catch (profileError) {
            this.loading = false;
            this.errorMsg = 'Your profile data could not be found. Please contact support.';
            this.authService.signOut();
          }
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.message;
      }
    });
  }
}
