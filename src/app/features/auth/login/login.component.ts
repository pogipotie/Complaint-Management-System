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
        <!-- Decorative blobs -->
        <div class="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-primary-500 opacity-50 blur-xl"></div>
        <div class="absolute bottom-0 left-0 -ml-8 -mb-8 w-40 h-40 rounded-full bg-primary-700 opacity-50 blur-xl"></div>
        
        <div class="relative z-10 flex flex-col items-center">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] mb-6">
            <mat-icon class="text-primary-600 scale-150">domain</mat-icon>
          </div>
          <p class="text-white text-lg leading-relaxed font-black uppercase tracking-wider" style="font-family: 'Arial Black', Impact, sans-serif;">
            Sign in to track your reported issues, communicate with local officials, and stay updated with your community.
          </p>
        </div>
      </div>

      <!-- Right Side / Form -->
      <div class="w-full sm:w-7/12 p-6 sm:p-10 flex flex-col justify-center bg-white">
        
        <!-- Mobile Logo Header (Only visible on small screens) -->
        <div class="sm:hidden flex flex-col items-center mb-8 pt-4">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-50 mb-3 shadow-sm border border-primary-100">
            <mat-icon class="text-primary-600 scale-110">domain</mat-icon>
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
          // Handle 'Email not confirmed' specifically
          if (error.message.toLowerCase().includes('email not confirmed')) {
            this.errorMsg = 'Your email address is not verified. Please check your inbox or register again to receive a new OTP.';
          } else {
            this.errorMsg = error.message;
          }
        } else if (data.user) {
          try {
            const profile = await this.authService.getUserProfile(data.user.id);
            this.loading = false;
            
            this.closeDialog(); // Close modal on success

            if (profile) {
              if (profile.role === 'admin' || profile.role === 'staff') {
                this.router.navigate(['/admin/dashboard']);
              } else if (profile.role === 'brgy_captain') {
                this.router.navigate(['/captain/dashboard']);
              } else {
                this.router.navigate(['/citizen/complaints']);
              }
            }
          } catch (profileError) {
            this.loading = false;
            // Provide a better error if the profile is missing entirely
            this.errorMsg = 'Your profile data could not be found. Please contact support.';
            this.authService.signOut(); // Ensure they don't stay in a broken state
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
