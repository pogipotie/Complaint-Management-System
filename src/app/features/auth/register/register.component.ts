import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

import { GoogleMap, MapMarker } from '@angular/google-maps';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MUNICIPALITY_CONFIG } from '../../../core/constants/municipality.config';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule,
    GoogleMap,
    MapMarker,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule
  ],
  template: `
    <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto space-y-8">
        
        <!-- Header & Progress -->
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] mb-4">
            <mat-icon color="primary" class="scale-150">how_to_reg</mat-icon>
          </div>
          <h2 class="text-3xl font-black text-gray-900 uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">
            Citizen Registration
          </h2>
          <p class="mt-2 text-sm font-bold text-gray-600 uppercase tracking-wider">
            Create an account to report issues and stay updated with the municipality.
          </p>

          <!-- Step Indicators -->
          <div class="flex items-center justify-center mt-8 max-w-3xl mx-auto">
            <div class="flex items-center" *ngFor="let step of [1, 2, 3, 4]; let isLast = last">
              <div class="flex flex-col items-center">
                <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 border-2 border-gray-900"
                  [ngClass]="{
                    'bg-primary-600 text-white shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]': currentStep >= step,
                    'bg-gray-100 text-gray-500': currentStep < step
                  }">
                  <mat-icon *ngIf="currentStep > step" class="scale-75">check</mat-icon>
                  <span *ngIf="currentStep <= step">{{ step }}</span>
                </div>
                <span class="text-xs font-medium mt-2" [ngClass]="{'text-primary-600': currentStep >= step, 'text-gray-500': currentStep < step}">
                  {{ step === 1 ? 'Account' : (step === 2 ? 'Personal Info' : (step === 3 ? 'Residency' : 'Verify Email')) }}
                </span>
              </div>
              <div *ngIf="!isLast" class="w-10 sm:w-16 h-1 mx-2 rounded transition-colors duration-300 -mt-6"
                [ngClass]="{'bg-primary-600': currentStep > step, 'bg-gray-200': currentStep <= step}">
              </div>
            </div>
          </div>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="bg-white rounded-sm overflow-hidden border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)]">
          
          <div class="p-8 sm:p-10">
            <!-- Step 1: Account Details -->
            <div *ngIf="currentStep === 1" class="animate-fade-in-up">
              <div class="border-b-2 border-gray-900 pb-4 mb-6">
                <h3 class="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2" style="font-family: 'Arial Black', Impact, sans-serif;">
                  <div class="w-8 h-8 rounded-sm bg-primary-100 border-2 border-gray-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                    <mat-icon color="primary" class="scale-90">lock</mat-icon>
                  </div>
                  Account Details
                </h3>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Email Address</mat-label>
                  <input matInput formControlName="email" type="email" placeholder="juan@example.com">
                  <mat-error *ngIf="registerForm.get('email')?.hasError('required')">Email is required</mat-error>
                  <mat-error *ngIf="registerForm.get('email')?.hasError('email')">Enter a valid email</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Password</mat-label>
                  <input matInput formControlName="password" [type]="hidePassword ? 'password' : 'text'" placeholder="Min. 6 characters">
                  <button type="button" mat-icon-button matSuffix (click)="hidePassword = !hidePassword" [attr.aria-label]="'Hide password'" [attr.aria-pressed]="hidePassword">
                    <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                  </button>
                  <mat-error *ngIf="registerForm.get('password')?.hasError('required')">Password is required</mat-error>
                  <mat-error *ngIf="registerForm.get('password')?.hasError('minlength')">Must be at least 6 characters</mat-error>
                </mat-form-field>
              </div>
            </div>

            <!-- Step 2: Personal Information -->
            <div *ngIf="currentStep === 2" class="animate-fade-in-up">
              <div class="border-b-2 border-gray-900 pb-4 mb-6">
                <h3 class="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2" style="font-family: 'Arial Black', Impact, sans-serif;">
                  <div class="w-8 h-8 rounded-sm bg-primary-100 border-2 border-gray-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                    <mat-icon color="primary" class="scale-90">person</mat-icon>
                  </div>
                  Personal Information
                </h3>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <mat-form-field appearance="outline" class="md:col-span-2 w-full">
                  <mat-label>Full Name</mat-label>
                  <input matInput formControlName="full_name" placeholder="First Name, M.I., Last Name">
                  <mat-error *ngIf="registerForm.get('full_name')?.hasError('required')">Full Name is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Date of Birth</mat-label>
                  <input matInput [matDatepicker]="picker" formControlName="date_of_birth">
                  <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                  <mat-error *ngIf="registerForm.get('date_of_birth')?.hasError('required')">Required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Gender</mat-label>
                  <mat-select formControlName="gender">
                    <mat-option value="Male">Male</mat-option>
                    <mat-option value="Female">Female</mat-option>
                    <mat-option value="Other">Other</mat-option>
                  </mat-select>
                  <mat-error *ngIf="registerForm.get('gender')?.hasError('required')">Required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Civil Status</mat-label>
                  <mat-select formControlName="civil_status">
                    <mat-option value="Single">Single</mat-option>
                    <mat-option value="Married">Married</mat-option>
                    <mat-option value="Widowed">Widowed</mat-option>
                    <mat-option value="Legally Separated">Legally Separated</mat-option>
                  </mat-select>
                  <mat-error *ngIf="registerForm.get('civil_status')?.hasError('required')">Required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Primary Phone Number</mat-label>
                  <input matInput formControlName="phone" placeholder="09XX XXX XXXX">
                  <mat-error *ngIf="registerForm.get('phone')?.hasError('required')">Phone is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Occupation</mat-label>
                  <input matInput formControlName="occupation" placeholder="e.g. Teacher, Unemployed, etc.">
                </mat-form-field>
                
                <div class="md:col-span-2 flex items-center pt-2 pb-4">
                  <mat-checkbox formControlName="is_pwd" color="primary">
                    Check if you are a Person with Disability (PWD)
                  </mat-checkbox>
                </div>
                
                <mat-divider class="md:col-span-2 my-2"></mat-divider>
                <div class="md:col-span-2 mt-2">
                  <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Emergency Contact (Optional)</h4>
                </div>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Emergency Contact Name</mat-label>
                  <input matInput formControlName="emergency_contact_name" placeholder="Name of relative/friend">
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Emergency Contact Number</mat-label>
                  <input matInput formControlName="emergency_contact_number" placeholder="09XX XXX XXXX">
                </mat-form-field>
              </div>
            </div>

            <!-- Step 3: Residency & Verification -->
            <div *ngIf="currentStep === 3" class="animate-fade-in-up">
              <div class="border-b-2 border-gray-900 pb-4 mb-6">
                <h3 class="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2" style="font-family: 'Arial Black', Impact, sans-serif;">
                  <div class="w-8 h-8 rounded-sm bg-primary-100 border-2 border-gray-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                    <mat-icon color="primary" class="scale-90">home</mat-icon>
                  </div>
                  Residency & Verification
                </h3>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Barangay</mat-label>
                  <mat-select formControlName="barangay" (selectionChange)="onBarangayChange($event.value)">
                    <mat-option *ngFor="let brgy of barangays" [value]="brgy">{{ brgy }}</mat-option>
                  </mat-select>
                  <mat-error *ngIf="registerForm.get('barangay')?.hasError('required')">Required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Street Address / House No.</mat-label>
                  <input matInput formControlName="street_address" placeholder="123 Rizal St.">
                  <mat-error *ngIf="registerForm.get('street_address')?.hasError('required')">Required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Type of Residency</mat-label>
                  <mat-select formControlName="residency_type">
                    <mat-option value="Homeowner">Homeowner</mat-option>
                    <mat-option value="Renter">Renter</mat-option>
                    <mat-option value="Living with relatives">Living with relatives</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Years of Residency</mat-label>
                  <input matInput type="number" formControlName="years_of_residency" placeholder="e.g. 5">
                </mat-form-field>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Location Map -->
                <div class="space-y-3">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <label class="text-sm font-medium text-gray-700">Pinpoint your Exact Home Location <span class="text-red-500">*</span></label>
                    <button mat-stroked-button type="button" color="primary" (click)="getCurrentLocation()" [disabled]="locating" class="scale-90 origin-left sm:origin-right">
                      <mat-icon>my_location</mat-icon> Use GPS
                    </button>
                  </div>
                  
                  <div *ngIf="mapLoaded" class="h-[200px] w-full rounded-sm border-2 border-gray-900 overflow-hidden relative shadow-[4px_4px_0px_0px_rgba(17,24,39,1)]">
                    <google-map height="100%" width="100%" [center]="mapCenter" [zoom]="15" (mapClick)="onMapClick($event)" [options]="{disableDefaultUI: true, zoomControl: true}">
                      <map-marker *ngIf="markerPosition" [position]="markerPosition" [options]="{draggable: true}" (mapDragend)="onMarkerDragEnd($event)"></map-marker>
                    </google-map>
                  </div>
                  <div *ngIf="!mapLoaded" class="h-[200px] w-full rounded-sm border-2 border-gray-900 bg-gray-50 flex items-center justify-center text-gray-500 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)]">
                    <mat-icon class="animate-spin text-primary-500 mb-2">autorenew</mat-icon>
                  </div>
                  <mat-error class="text-xs" *ngIf="registerForm.get('latitude')?.hasError('required') && formSubmitted">
                    Please pin your location on the map.
                  </mat-error>
                </div>

                <!-- ID Upload -->
                <div class="space-y-3">
                  <label class="text-sm font-medium text-gray-700">Upload Valid ID (Proof of Residency) <span class="text-red-500">*</span></label>
                  <div class="upload-dropzone h-[200px] flex flex-col justify-center border-2 border-dashed border-gray-900 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] bg-gray-50 hover:bg-primary-50 hover:border-primary-600 transition-colors" [class.has-file]="!!selectedFile" [class.border-red-500]="formSubmitted && !selectedFile" (click)="!selectedFile ? fileInput.click() : null">
                    <input type="file" #fileInput class="hidden" accept="image/jpeg, image/png, image/webp" capture="environment" (change)="onFileSelected($event)">
                    
                    <ng-container *ngIf="!selectedFile">
                      <mat-icon class="upload-icon mx-auto" [class.text-red-400]="formSubmitted && !selectedFile">cloud_upload</mat-icon>
                      <div class="mt-4 text-sm text-gray-600 font-medium">Take a photo or upload ID</div>
                      <div class="text-xs text-gray-400 mt-1">PNG, JPG, WEBP</div>
                    </ng-container>

                    <ng-container *ngIf="selectedFile">
                      <div class="flex flex-col items-center justify-center text-center w-full h-full">
                        <img [src]="imagePreviewUrl" class="w-24 h-24 rounded-sm object-cover border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] mb-3" alt="Preview">
                        <div class="w-full flex justify-between items-center px-4 bg-white rounded-sm p-2 border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                          <span class="text-sm font-bold text-gray-900 truncate max-w-[150px]">{{ selectedFile.name }}</span>
                          <button mat-icon-button type="button" (click)="removeFile($event)" color="warn" class="scale-90 bg-white shadow-sm border border-gray-200">
                            <mat-icon>close</mat-icon>
                          </button>
                        </div>
                      </div>
                    </ng-container>
                  </div>
                  <mat-error class="text-xs" *ngIf="formSubmitted && !selectedFile">
                    Proof of Residency (ID) is required.
                  </mat-error>
                </div>
              </div>
            </div>

            <!-- Step 4: OTP Verification -->
            <div *ngIf="currentStep === 4" class="animate-fade-in-up">
              <div class="border-b-2 border-gray-900 pb-4 mb-6">
                <h3 class="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2" style="font-family: 'Arial Black', Impact, sans-serif;">
                  <div class="w-8 h-8 rounded-sm bg-primary-100 border-2 border-gray-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                    <mat-icon color="primary" class="scale-90">mark_email_read</mat-icon>
                  </div>
                  Verify Your Email
                </h3>
              </div>
              
              <div class="bg-primary-50 border-2 border-gray-900 p-6 rounded-sm shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] text-center max-w-md mx-auto">
                <mat-icon class="scale-[2] text-primary-600 mb-4 mt-2">mark_email_unread</mat-icon>
                <h4 class="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">Check Your Inbox</h4>
                <p class="text-sm font-bold text-gray-700 mb-6">We've sent a 6-digit verification code to <span class="text-primary-700">{{ registerForm.get('email')?.value }}</span>. Enter it below to complete your registration.</p>
                
                <mat-form-field appearance="outline" class="w-full max-w-[250px] mx-auto text-center otp-input">
                  <mat-label>6-Digit Code</mat-label>
                  <input matInput formControlName="otp" type="text" placeholder="123456" maxlength="6" class="text-center text-2xl font-black tracking-[0.5em] text-primary-600">
                  <mat-error *ngIf="registerForm.get('otp')?.hasError('pattern')">Enter a valid 6-digit code</mat-error>
                  <mat-error *ngIf="formSubmitted && registerForm.get('otp')?.hasError('required')">Code is required</mat-error>
                </mat-form-field>

                <div class="mt-4">
                  <button type="button" mat-button color="primary" (click)="resendOtp()" [disabled]="resendTimer > 0 || loading" class="font-bold uppercase tracking-wider text-xs">
                    {{ resendTimer > 0 ? 'Resend code in ' + resendTimer + 's' : 'Resend Code' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Wizard Navigation -->
          <div class="bg-gray-50 px-8 py-6 border-t-2 border-gray-900 flex items-center justify-between">
            <button *ngIf="currentStep > 1 && currentStep < 4" type="button" mat-stroked-button color="primary" (click)="prevStep()" class="!px-6 !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider">
              <mat-icon>arrow_back</mat-icon> Back
            </button>
            <div *ngIf="currentStep === 1 || currentStep === 4"></div> <!-- Spacer -->

            <button *ngIf="currentStep < 3" type="button" mat-flat-button color="primary" (click)="nextStep()" class="!px-8 !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider">
              Next Step <mat-icon iconPositionEnd>arrow_forward</mat-icon>
            </button>

            <button *ngIf="currentStep === 3" type="submit" [disabled]="loading" mat-flat-button color="primary" class="!px-8 !bg-green-500 hover:!bg-green-600 !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider">
              <mat-icon *ngIf="loading" class="animate-spin mr-2">autorenew</mat-icon>
              {{ loading ? 'Sending...' : 'Send Code' }}
            </button>

            <button *ngIf="currentStep === 4" type="submit" [disabled]="loading" mat-flat-button color="primary" class="!px-8 !bg-green-500 hover:!bg-green-600 !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider">
              <mat-icon *ngIf="loading" class="animate-spin mr-2">autorenew</mat-icon>
              {{ loading ? 'Verifying...' : 'Verify & Complete' }}
            </button>
          </div>

        </form>

        <div class="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-sm border border-red-100 shadow-sm flex items-start gap-2" *ngIf="errorMsg">
          <mat-icon class="scale-75 text-red-500 shrink-0">error</mat-icon> <span class="mt-0.5">{{ errorMsg }}</span>
        </div>
        <div class="text-green-600 text-sm font-medium bg-green-50 p-3 rounded-sm border border-green-100 shadow-sm flex items-start gap-2" *ngIf="successMsg">
          <mat-icon class="scale-75 text-green-500 shrink-0">check_circle</mat-icon> <span class="mt-0.5">{{ successMsg }}</span>
        </div>

        <div class="text-sm text-center pb-8">
          <button type="button" (click)="closeAndReturnToLogin()" class="font-medium text-gray-900 hover:text-primary-600 bg-white py-2 px-6 rounded-sm shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] border-2 border-gray-900 inline-block uppercase tracking-wider text-[11px] font-black transition-colors">
            Already have an account? Sign in
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .upload-dropzone {
      border: 2px dashed #d1d5db;
      border-radius: 4px;
      padding: 32px 24px;
      text-align: center;
      background: #f9fafb;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .upload-dropzone:hover {
      border-color: #4f46e5;
      background: #eef2ff;
    }
    .upload-dropzone.has-file {
      padding: 16px;
      border-style: solid;
      border-color: #e5e7eb;
      background: white;
      cursor: default;
    }
    .upload-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #9ca3af;
    }
    mat-card-header {
      padding: 16px 24px 0 24px !important;
    }
    mat-card-content {
      padding: 16px 24px 24px 24px !important;
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up {
      animation: fadeInUp 0.4s ease-out forwards;
    }
  `]
})
export class RegisterComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    full_name: ['', Validators.required],
    date_of_birth: ['', Validators.required],
    gender: ['', Validators.required],
    civil_status: ['', Validators.required],
    occupation: [''],
    is_pwd: [false],
    phone: ['', Validators.required],
    emergency_contact_name: [''],
    emergency_contact_number: [''],
    barangay: ['', Validators.required],
    street_address: ['', Validators.required],
    residency_type: [''],
    years_of_residency: [null],
    latitude: [null, Validators.required],
    longitude: [null, Validators.required],
    otp: ['', [Validators.pattern('^[0-9]{6}$')]]
  });

  hidePassword = true;
  loading = false;
  errorMsg = '';
  successMsg = '';
  formSubmitted = false;
  currentStep = 1;

  resendTimer = 60;
  private timerInterval: any;

  // Map state
  mapLoaded = false;
  locating = false;
  scriptElement: HTMLScriptElement | null = null;
  mapCenter: google.maps.LatLngLiteral = { 
    lat: MUNICIPALITY_CONFIG.centerLat, 
    lng: MUNICIPALITY_CONFIG.centerLng 
  };
  markerPosition: google.maps.LatLngLiteral | null = null;

  barangays = MUNICIPALITY_CONFIG.barangays;

  // File state
  selectedFile: File | null = null;
  imagePreviewUrl: string | ArrayBuffer | null = null;

  ngOnInit() {
    this.loadGoogleMaps();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  closeAndReturnToLogin() {
    // Navigate back to the landing page and pass a query parameter
    // to automatically trigger the login modal.
    this.router.navigate(['/'], { queryParams: { action: 'login' } });
  }

  startResendTimer() {
    this.resendTimer = 60;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.timerInterval = setInterval(() => {
      if (this.resendTimer > 0) {
        this.resendTimer--;
      } else {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  // ---- Wizard Logic ----
  async nextStep() {
    this.errorMsg = '';
    
    // Validate Step 1
    if (this.currentStep === 1) {
      const step1Fields = ['email', 'password'];
      let isValid = true;
      step1Fields.forEach(field => {
        const control = this.registerForm.get(field);
        control?.markAsTouched();
        if (control?.invalid) isValid = false;
      });
      if (!isValid) return;

      this.loading = true;
      const email = this.registerForm.get('email')?.value;
      const emailExists = await this.authService.checkEmailExists(email);
      
      if (emailExists) {
        // Check if fully verified
        const { error: signInCheckError } = await this.supabaseService.supabase.auth.signInWithPassword({
          email: email,
          password: 'dummy_password_to_check_status_123'
        });

        if (signInCheckError?.message.toLowerCase().includes('email not confirmed')) {
          // They are unverified, they can proceed and we'll resend OTP at the end
          this.loading = false;
        } else {
          // They are fully verified.
          this.loading = false;
          this.errorMsg = 'This email is already registered. Please proceed to the Login page.';
          return;
        }
      } else {
        this.loading = false;
      }
    }
    
    // Validate Step 2
    if (this.currentStep === 2) {
      const step2Fields = ['full_name', 'date_of_birth', 'gender', 'civil_status', 'phone'];
      let isValid = true;
      step2Fields.forEach(field => {
        const control = this.registerForm.get(field);
        control?.markAsTouched();
        if (control?.invalid) isValid = false;
      });
      if (!isValid) return;
    }

    if (this.currentStep < 3) {
      this.currentStep++;
      if (this.currentStep === 3 && !this.mapLoaded) {
        // Just in case map hasn't loaded yet by the time they reach step 3
        this.loadGoogleMaps();
      }
    }
  }

  prevStep() {
    this.errorMsg = '';
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // ---- Map Logic ----
  loadGoogleMaps() {
    if ((window as any).google?.maps) {
      this.initMap();
      return;
    }
    if (document.getElementById('google-maps-script')) {
      const checkInterval = setInterval(() => {
        if ((window as any).google?.maps) {
          clearInterval(checkInterval);
          this.initMap();
        }
      }, 100);
      return;
    }
    this.scriptElement = document.createElement('script');
    this.scriptElement.id = 'google-maps-script';
    this.scriptElement.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places`;
    this.scriptElement.async = true;
    this.scriptElement.defer = true;
    this.scriptElement.onload = () => this.initMap();
    document.head.appendChild(this.scriptElement);
  }

  initMap() {
    this.mapLoaded = true;
  }

  onBarangayChange(barangay: string) {
    if (!this.mapLoaded || !barangay) return;
    
    // Create a Geocoder instance to find the exact coordinates of the selected Barangay
    const geocoder = new google.maps.Geocoder();
    const address = `Barangay ${barangay}, Gonzaga, Cagayan, Philippines`;
    
    this.locating = true;
    geocoder.geocode({ address: address }, (results, status) => {
      this.locating = false;
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        const newCenter = { lat: location.lat(), lng: location.lng() };
        
        // Pan the map to the new Barangay
        this.mapCenter = newCenter;
        // Automatically drop a pin there so the user doesn't have to start from scratch
        this.updateMarker(newCenter);
      } else {
        console.warn('Geocode was not successful for the following reason: ' + status);
      }
    });
  }

  getCurrentLocation() {
    if (!navigator.geolocation) {
      this.errorMsg = 'Geolocation is not supported by your browser';
      return;
    }
    this.locating = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.locating = false;
        this.mapCenter = { lat: position.coords.latitude, lng: position.coords.longitude };
        this.updateMarker(this.mapCenter);
      },
      (error) => {
        this.locating = false;
        console.warn('Geolocation error:', error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    if (event.latLng) this.updateMarker(event.latLng.toJSON());
  }

  onMarkerDragEnd(event: google.maps.MapMouseEvent) {
    if (event.latLng) this.updateMarker(event.latLng.toJSON());
  }

  updateMarker(position: google.maps.LatLngLiteral) {
    this.markerPosition = position;
    this.registerForm.patchValue({ latitude: position.lat, longitude: position.lng });
  }

  // ---- File Logic ----
  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      try {
        const compressedFile = await this.compressImage(file);
        this.selectedFile = compressedFile;
        const reader = new FileReader();
        reader.onload = () => this.imagePreviewUrl = reader?.result ?? null;
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

  // ---- Submit Logic ----
  async onSubmit() {
    this.formSubmitted = true;
    this.errorMsg = '';
    this.successMsg = '';

    if (this.currentStep === 4) {
      await this.verifyOtpAndComplete();
      return;
    }
    
    // Final Step Validation
    const step3Fields = ['barangay', 'street_address', 'latitude', 'longitude'];
    let isValid = true;
    step3Fields.forEach(field => {
      const control = this.registerForm.get(field);
      control?.markAsTouched();
      if (control?.invalid) isValid = false;
    });

    if (!isValid || !this.selectedFile) {
      this.errorMsg = 'Please complete all required fields and upload an ID.';
      return;
    }
    
    this.loading = true;
    
    const formVals = this.registerForm.value;
    
    try {
      // Check if email already exists
      const emailExists = await this.authService.checkEmailExists(formVals.email);
      
      if (emailExists) {
        const { error: signInCheckError } = await this.supabaseService.supabase.auth.signInWithPassword({
          email: formVals.email,
          password: 'dummy_password_to_check_status_123'
        });

        if (signInCheckError?.message.toLowerCase().includes('email not confirmed')) {
          this.errorMsg = 'This email is already registered but unverified. We are resending your code...';
          
          const { error: resendError } = await this.supabaseService.supabase.auth.resend({
            type: 'signup',
            email: formVals.email
          });

          if (resendError) {
            throw new Error('Failed to resend code. Please try again.');
          }

          this.currentStep = 4;
          this.loading = false;
          this.formSubmitted = false;
          this.successMsg = 'A new code has been sent to your email.';
          this.startResendTimer();
          
          setTimeout(() => { this.successMsg = ''; }, 5000);
          return;
        } else {
          throw new Error('This email is already fully registered. Please proceed to the Login page.');
        }
      }

      // 1. Sign up the user in auth.users
      const { data: authData, error: authError } = await this.supabaseService.supabase.auth.signUp({
        email: formVals.email,
        password: formVals.password
      });

      if (authError) throw authError;
      
      // Check if email confirmation is enabled (session will be null)
      if (!authData.session) {
        // Switch to OTP step
        this.currentStep = 4;
        this.loading = false;
        this.formSubmitted = false;
        this.startResendTimer();
        return;
      }

      // If email confirmation was disabled, session exists, proceed directly
      const userId = authData.user?.id;
      if (!userId) throw new Error('Failed to retrieve user ID after registration.');
      
      await this.uploadProfileAndComplete(userId);
      
    } catch (err: any) {
      this.errorMsg = err.message || 'An unexpected error occurred during registration.';
      this.loading = false;
    }
  }

  async verifyOtpAndComplete() {
    const otpControl = this.registerForm.get('otp');
    otpControl?.setValidators([Validators.required, Validators.pattern('^[0-9]{6}$')]);
    otpControl?.updateValueAndValidity();
    
    if (otpControl?.invalid) {
      this.errorMsg = 'Please enter the 6-digit code sent to your email.';
      return;
    }

    this.loading = true;
    const formVals = this.registerForm.value;

    try {
      const { data, error } = await this.supabaseService.supabase.auth.verifyOtp({
        email: formVals.email,
        token: formVals.otp,
        type: 'signup'
      });

      if (error) throw error;
      
      const userId = data.user?.id;
      if (!userId) throw new Error('Failed to retrieve verified user ID.');

      await this.uploadProfileAndComplete(userId);

    } catch (err: any) {
      let errorText = err.message || 'Invalid verification code.';
      
      // Parse raw JSON error string if Supabase returns it
      try {
        const parsed = JSON.parse(errorText);
        errorText = parsed.message || errorText;
      } catch (e) {
        // Not a JSON string, leave as is
      }
      
      // Provide a clean, user-friendly message
      if (errorText.toLowerCase().includes('token has expired') || errorText.toLowerCase().includes('invalid')) {
        errorText = 'The verification code is incorrect or has expired. Please check the code or request a new one.';
      }
      
      this.errorMsg = errorText;
      this.loading = false;
    }
  }

  async resendOtp() {
    if (this.resendTimer > 0) return;
    
    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';
    
    const email = this.registerForm.get('email')?.value;
    
    try {
      const { error } = await this.supabaseService.supabase.auth.resend({
        type: 'signup',
        email: email
      });
      
      if (error) throw error;
      
      this.successMsg = 'A new code has been sent to your email.';
      this.startResendTimer();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        this.successMsg = '';
      }, 5000);
      
    } catch (err: any) {
      this.errorMsg = err.message || 'Failed to resend code. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  private async uploadProfileAndComplete(userId: string) {
    try {
      const formVals = this.registerForm.value;

      // 2. Upload Proof of Residency
      const filePath = `${userId}/${Date.now()}.jpeg`;
      const { error: uploadError } = await this.supabaseService.supabase.storage
        .from('citizen_ids')
        .upload(filePath, this.selectedFile!);
        
      if (uploadError) throw uploadError;

      // 3. Create profile in public.users
      // We now save the secure filePath instead of generating a public URL
      const { error: profileError } = await this.supabaseService.supabase
        .from('users')
        .insert({
          id: userId,
          role: 'citizen',
          full_name: formVals.full_name,
          phone: formVals.phone,
          barangay: formVals.barangay,
          street_address: formVals.street_address,
          latitude: formVals.latitude,
          longitude: formVals.longitude,
          date_of_birth: formVals.date_of_birth,
          gender: formVals.gender,
          civil_status: formVals.civil_status,
          occupation: formVals.occupation,
          residency_type: formVals.residency_type,
          years_of_residency: formVals.years_of_residency,
          is_pwd: formVals.is_pwd,
          emergency_contact_name: formVals.emergency_contact_name,
          emergency_contact_number: formVals.emergency_contact_number,
          proof_of_residency_url: filePath
        });

      if (profileError) throw profileError;

      this.successMsg = 'Registration successful! You can now log in.';
      this.registerForm.reset();
      this.selectedFile = null;
      this.formSubmitted = false;
      this.currentStep = 1;
      
    } catch (err: any) {
      this.errorMsg = err.message || 'An unexpected error occurred during profile creation.';
    } finally {
      this.loading = false;
    }
  }
}
