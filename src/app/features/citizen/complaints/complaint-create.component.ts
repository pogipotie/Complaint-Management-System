import { Component, inject, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ComplaintsService } from '../../../core/services/complaints.service';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { environment } from '../../../../environments/environment';
import { GoogleMap, MapMarker } from '@angular/google-maps';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MUNICIPALITY_CONFIG } from '../../../core/constants/municipality.config';

@Component({
  selector: 'app-complaint-create',
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
    MatProgressBarModule
  ],

  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-16">

      <!-- Header -->
      <div class="flex items-start gap-4 mb-8">
        <button mat-icon-button routerLink="/citizen/complaints" class="back-btn !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
          <mat-icon class="text-gray-900">arrow_back</mat-icon>
        </button>
        <div>
          <h1 class="text-3xl font-black tracking-tight text-gray-900 uppercase" style="font-family: 'Arial Black', Impact, sans-serif;">Report an Issue</h1>
          <p class="mt-2 font-bold text-gray-600 text-sm uppercase tracking-wider">Help improve the municipality by providing accurate complaint details.</p>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="verificationStatus === 'loading'" class="flex justify-center items-center py-20">
        <mat-icon class="animate-spin text-primary-600 scale-150">autorenew</mat-icon>
      </div>

      <!-- Wizard Progress Bar -->
      <div class="mb-8" *ngIf="isVerified">
        <div class="flex justify-between items-center mb-2">
          <span class="text-[10px] font-black uppercase tracking-widest text-primary-600 border border-primary-200 bg-primary-50 px-2 py-0.5 rounded-sm">Step {{ currentStep }} of 3</span>
          <span class="text-[10px] font-black uppercase tracking-widest text-gray-500">{{ getStepTitle() }}</span>
        </div>
        <div class="w-full bg-gray-200 border-2 border-gray-900 rounded-sm h-4 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
          <div class="bg-primary-500 border-r-2 border-gray-900 h-full rounded-l-sm transition-all duration-300" [style.width.%]="(currentStep / 3) * 100"></div>
        </div>
      </div>

      <div *ngIf="!isVerified && verificationStatus === 'pending'" class="bg-yellow-50 border-2 border-gray-900 rounded-sm p-8 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] text-center">
        <mat-icon class="text-yellow-600 scale-[2] mb-4">gpp_maybe</mat-icon>
        <h2 class="text-2xl font-black text-gray-900 uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">Account Pending Verification</h2>
        <p class="mt-4 font-bold text-gray-700">Your account is currently <span class="text-yellow-700 uppercase tracking-wider">{{ verificationStatus }}</span>.</p>
        <p class="mt-2 text-sm text-gray-600">The municipality admin must review your valid ID and proof of residency before you can submit official complaints. Please check back later.</p>
        <button mat-stroked-button routerLink="/citizen/community" class="mt-6 !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider">
          Return to Map
        </button>
      </div>

      <div *ngIf="!isVerified && verificationStatus === 'rejected'" class="bg-red-50 border-2 border-gray-900 rounded-sm p-8 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] text-center flex flex-col items-center">
        <mat-icon class="text-red-600 scale-[2] mb-4">gpp_bad</mat-icon>
        <h2 class="text-2xl font-black text-gray-900 uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">Registration Rejected</h2>
        <p class="mt-4 font-bold text-gray-700">Your account registration was declined by the municipality.</p>
        
        <div class="mt-4 mb-6 bg-white border-2 border-gray-900 p-4 text-center w-full max-w-lg shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
          <p class="text-xs font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
            <mat-icon class="scale-75 text-red-500">info</mat-icon> Reason for Rejection:
          </p>
          <p class="text-sm font-bold text-gray-900">{{ rejectionReason || 'No specific reason provided.' }}</p>
        </div>

        <p class="text-sm text-gray-600 font-bold w-full max-w-lg text-center leading-relaxed">
          Your account data will be automatically deleted 24 hours after your original registration time. Once deleted, you may register again with corrected information.
        </p>
        
        <button mat-stroked-button routerLink="/citizen/community" class="mt-6 !rounded-sm !border-2 !border-gray-900 !bg-white !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider">
          Return to Map
        </button>
      </div>

      <div *ngIf="!isVerified && verificationStatus === 'banned'" class="bg-gray-800 border-2 border-gray-900 rounded-sm p-8 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] text-center flex flex-col items-center">
        <mat-icon class="text-white scale-[2] mb-4">block</mat-icon>
        <h2 class="text-2xl font-black text-white uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">Account Banned</h2>
        <p class="mt-4 font-bold text-gray-300">Your account has been permanently suspended by the municipality administration.</p>
        
        <div class="mt-4 bg-gray-900 border-2 border-gray-700 p-4 text-center w-full max-w-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <p class="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
            <mat-icon class="scale-75 text-gray-300">info</mat-icon> Reason for Ban:
          </p>
          <p class="text-sm font-bold text-white">{{ rejectionReason || 'Violation of community guidelines.' }}</p>
        </div>

        <button mat-stroked-button routerLink="/citizen/community" class="mt-6 !rounded-sm !border-2 !border-gray-500 !bg-gray-700 !text-white !shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all font-black uppercase tracking-wider">
          Return to Map
        </button>
      </div>

      <form *ngIf="isVerified" [formGroup]="complaintForm" (ngSubmit)="onSubmit()" class="space-y-8 relative">

        <!-- STEP 1: Basic Information -->
        <div [class.hidden]="currentStep !== 1" class="animate-fade-in">
          <mat-card class="modern-card">
            <div class="section-header">
              <div class="section-icon"><mat-icon>info</mat-icon></div>
              <div>
                <h2 class="section-title">Basic Information</h2>
                <p class="section-subtitle">Provide the main complaint details</p>
              </div>
            </div>
            <mat-card-content class="card-content">
              <mat-form-field appearance="outline">
                <mat-label>Complaint Title</mat-label>
                <input matInput formControlName="title" placeholder="e.g. Deep pothole on Main Street">
                <mat-error *ngIf="complaintForm.get('title')?.hasError('required')">Title is required</mat-error>
                <mat-error *ngIf="complaintForm.get('title')?.hasError('minlength')">Title must be at least 5 characters</mat-error>
              </mat-form-field>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <mat-form-field appearance="outline">
                  <mat-label>Category</mat-label>
                  <mat-select formControlName="category_id" (selectionChange)="onCategoryChange($event.value)">
                    <mat-option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</mat-option>
                  </mat-select>
                  <mat-error *ngIf="complaintForm.get('category_id')?.hasError('required')">Category is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" *ngIf="showCustomCategory">
                  <mat-label>Specify Category</mat-label>
                  <input matInput formControlName="custom_category" placeholder="e.g. Stray Dogs">
                  <mat-error *ngIf="complaintForm.get('custom_category')?.hasError('required')">Please specify the category</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Priority Level</mat-label>
                  <mat-select formControlName="priority">
                    <mat-option value="low">Low - Minor issue</mat-option>
                    <mat-option value="medium">Medium - Needs attention soon</mat-option>
                    <mat-option value="high">High - Significant disruption</mat-option>
                    <mat-option value="emergency">Emergency - Immediate danger</mat-option>
                  </mat-select>
                  <mat-error *ngIf="complaintForm.get('priority')?.hasError('required')">Priority is required</mat-error>
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- STEP 2: Location Details -->
        <div [class.hidden]="currentStep !== 2" class="animate-fade-in">
          <mat-card class="modern-card">
            <div class="section-header">
              <div class="section-icon"><mat-icon>place</mat-icon></div>
              <div>
                <h2 class="section-title">Location Details</h2>
                <p class="section-subtitle">Specify where the issue is located</p>
              </div>
            </div>
            <mat-card-content class="card-content">
              <mat-form-field appearance="outline" class="md:w-1/2">
                <mat-label>Barangay / Location</mat-label>
                <mat-select formControlName="barangay" (selectionChange)="onBarangayChange($event.value)">
                  <mat-option *ngFor="let brgy of barangays" [value]="brgy">{{ brgy }}</mat-option>
                </mat-select>
                <mat-hint *ngIf="isVerified" class="text-[10px] font-bold text-gray-500">
                  Locked to your registered barangay.
                </mat-hint>
                <mat-error *ngIf="complaintForm.get('barangay')?.hasError('required')">Barangay is required</mat-error>
              </mat-form-field>

              <div class="space-y-3">
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <label class="text-sm font-medium text-gray-700">Pinpoint Location <span class="text-red-500">*</span></label>
                  <div class="flex items-center gap-2">
                    <button mat-stroked-button type="button" color="primary" (click)="getCurrentLocation()" [disabled]="locating" class="h-8 text-xs location-btn">
                      <mat-icon>my_location</mat-icon>
                      <span>{{ locating ? 'Locating...' : 'Use My Location' }}</span>
                    </button>
                    <span class="map-badge hidden sm:inline-block">Drag marker to adjust</span>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-2" *ngIf="complaintForm.get('latitude')?.value">
                  <div class="text-xs bg-gray-50 p-2 rounded border border-gray-200 text-gray-600 flex items-center">
                    <span class="font-semibold mr-2 text-gray-700">Lat:</span> {{ complaintForm.get('latitude')?.value | number:'1.6-6' }}
                  </div>
                  <div class="text-xs bg-gray-50 p-2 rounded border border-gray-200 text-gray-600 flex items-center">
                    <span class="font-semibold mr-2 text-gray-700">Lng:</span> {{ complaintForm.get('longitude')?.value | number:'1.6-6' }}
                  </div>
                </div>

                <div *ngIf="mapLoaded" class="map-container">
                  <google-map height="100%" width="100%" [center]="mapCenter" [zoom]="15" (mapClick)="onMapClick($event)" [options]="{disableDefaultUI: true, zoomControl: true}">
                    <map-marker *ngIf="markerPosition" [position]="markerPosition" [options]="{draggable: true, animation: 2}" (mapDragend)="onMarkerDragEnd($event)"></map-marker>
                  </google-map>
                </div>

                <div *ngIf="!mapLoaded" class="map-loading">
                  <mat-icon class="animate-spin text-indigo-500">autorenew</mat-icon>
                  <span class="text-gray-500 font-medium">Loading Map Interface...</span>
                </div>
                
                <mat-error class="text-xs mt-1" *ngIf="formSubmitted && !complaintForm.get('latitude')?.value">
                  Please pin the location on the map.
                </mat-error>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- STEP 3: Additional Details & Photo -->
        <div [class.hidden]="currentStep !== 3" class="animate-fade-in">
          <mat-card class="modern-card">
            <div class="section-header">
              <div class="section-icon"><mat-icon>description</mat-icon></div>
              <div>
                <h2 class="section-title">Additional Details</h2>
                <p class="section-subtitle">Add more information about the complaint</p>
              </div>
            </div>
            <mat-card-content class="card-content">
              <mat-form-field appearance="outline">
                <mat-label>Description</mat-label>
                <textarea matInput rows="6" formControlName="description" placeholder="Please provide detailed information about the issue..."></textarea>
                <mat-error *ngIf="complaintForm.get('description')?.hasError('required')">Description is required</mat-error>
                <mat-error *ngIf="complaintForm.get('description')?.hasError('minlength')">Please provide more details (minimum 10 characters)</mat-error>
              </mat-form-field>

              <div class="space-y-3">
                <label class="text-sm font-medium text-gray-700 block">Attach a Photo <span class="text-red-500">*</span></label>
                <div class="upload-dropzone" [class.has-file]="!!selectedFile" [class.border-red-500]="formSubmitted && !selectedFile" (click)="!selectedFile ? fileInput.click() : null">
                  <input type="file" #fileInput class="hidden" accept="image/jpeg, image/png, image/webp" capture="environment" (change)="onFileSelected($event)">
                  <ng-container *ngIf="!selectedFile">
                    <mat-icon class="upload-icon" [class.text-red-400]="formSubmitted && !selectedFile">add_a_photo</mat-icon>
                    <div class="mt-2 text-sm text-gray-600 font-medium">Take a photo or upload an image</div>
                    <div class="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (Will be compressed automatically)</div>
                  </ng-container>
                  <ng-container *ngIf="selectedFile">
                    <div class="file-preview">
                      <img [src]="imagePreviewUrl" class="preview-img" alt="Preview">
                      <div class="file-info">
                        <span class="file-name">{{ selectedFile.name }}</span>
                        <button mat-icon-button type="button" (click)="removeFile($event)" color="warn" class="remove-btn"><mat-icon>close</mat-icon></button>
                      </div>
                    </div>
                  </ng-container>
                </div>
                <mat-error class="text-xs mt-1" *ngIf="formSubmitted && !selectedFile">
                  A photo of the issue is required to submit a complaint.
                </mat-error>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Error Alert -->
        <div *ngIf="errorMsg" class="error-alert mt-4">
          <mat-icon class="text-red-500">error_outline</mat-icon>
          <div>
            <h4 class="font-semibold text-red-800">Submission Failed</h4>
            <p class="text-sm text-red-700 mt-1">{{ errorMsg }}</p>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-4 mt-8">
          <button *ngIf="currentStep > 1" mat-stroked-button type="button" (click)="prevStep()" [disabled]="loading" class="action-btn !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider">
            <mat-icon>navigate_before</mat-icon> Back
          </button>
          <div *ngIf="currentStep === 1" class="hidden sm:block"></div> <!-- Spacer -->

          <button *ngIf="currentStep < 3" mat-flat-button color="primary" type="button" (click)="nextStep()" class="action-btn !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider">
            Next <mat-icon iconPositionEnd>navigate_next</mat-icon>
          </button>

          <button *ngIf="currentStep === 3" mat-flat-button color="primary" type="submit" [disabled]="loading" class="action-btn !bg-green-500 hover:!bg-green-600 !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider">
            <mat-icon *ngIf="!loading">send</mat-icon>
            <mat-icon *ngIf="loading" class="animate-spin">autorenew</mat-icon>
            {{ loading ? 'Submitting...' : 'Submit Complaint' }}
          </button>
        </div>

      </form>
    </div>
  `,

  styles: [`
    :host {
      display: block;
    }

    .mat-mdc-form-field {
      width: 100%;
    }

    .modern-card {
      overflow: hidden;
      background: white;
      border: 2px solid #111827; /* gray-900 */
      border-radius: 4px; /* rounded-sm */
      box-shadow: 4px 4px 0px 0px rgba(17,24,39,1);
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px 28px;
      border-bottom: 2px solid #111827;
      background: #f9fafb;
    }

    .section-icon {
      height: 44px;
      width: 44px;
      border-radius: 4px;
      background: #f0fdf4;
      border: 2px solid #111827;
      color: #16a34a;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 900;
      color: #111827;
      margin: 0;
      text-transform: uppercase;
      font-family: 'Arial Black', Impact, sans-serif;
      letter-spacing: 0.05em;
    }

    .section-subtitle {
      margin-top: 2px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
    }

    .card-content {
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .back-btn {
      background: white;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      color: #6b7280;
    }

    .back-btn:hover {
      background: #f9fafb;
      color: #4f46e5;
    }

    .map-container {
      height: 360px;
      width: 100%;
      border-radius: 4px;
      overflow: hidden;
      border: 2px solid #111827;
      background: #f3f4f6;
    }

    .map-loading {
      height: 360px;
      width: 100%;
      border-radius: 4px;
      border: 2px dashed #111827;
      background: #f9fafb;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .map-badge {
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #16a34a;
      background: #f0fdf4;
      border: 1px solid #16a34a;
      padding: 0 12px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      border-radius: 4px;
    }

    .location-btn {
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      height: 32px !important;
    }
    
    .location-btn ::ng-deep .mat-mdc-button-touch-target,
    .location-btn ::ng-deep .mdc-button__label {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .location-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      line-height: 16px;
      margin: 0;
    }

    .search-text-btn {
      margin-right: 8px !important;
      font-weight: 600 !important;
      letter-spacing: 0.5px;
      height: 36px !important;
      border-radius: 4px !important;
    }

    .action-btn {
      height: 48px;
      padding: 0 24px;
      border-radius: 4px !important;
      font-weight: 600;
      min-width: 150px;
    }

    .error-alert {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 16px;
      border-radius: 4px;
      background: #fef2f2;
      border: 1px solid #fecaca;
    }

    /* Image Upload Styles */
    .upload-dropzone {
      border: 2px dashed #111827;
      border-radius: 4px;
      padding: 32px 24px;
      text-align: center;
      background: #f9fafb;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }

    .upload-dropzone:hover {
      border-color: #16a34a;
      background: #f0fdf4;
    }

    .upload-dropzone.has-file {
      padding: 16px;
      border-style: solid;
      border-color: #111827;
      background: white;
      cursor: default;
    }

    .upload-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #9ca3af;
    }

    .upload-dropzone:hover .upload-icon {
      color: #16a34a;
    }

    .file-preview {
      display: flex;
      align-items: center;
      gap: 16px;
      text-align: left;
    }

    .preview-img {
      width: 64px;
      height: 64px;
      border-radius: 4px;
      object-fit: cover;
      border: 2px solid #111827;
    }

    .file-info {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .file-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      word-break: break-all;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    textarea {
      resize: vertical;
      min-height: 140px;
    }

    .mdc-text-field--outlined {
      --mdc-outlined-text-field-focus-outline-width: 2px;
      --mdc-outlined-text-field-focus-outline-color: #16a34a;
    }

    .mat-mdc-select-trigger {
      align-items: center;
    }

    .mat-mdc-form-field-subscript-wrapper {
      margin-top: 4px;
    }

    /* Animation for wizard steps */
    .animate-fade-in {
      animation: fadeIn 0.4s ease-out forwards;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 640px) {
      .card-content {
        padding: 20px;
      }

      .section-header {
        padding: 20px;
      }

      .map-container,
      .map-loading {
        height: 300px;
      }
    }
  `]
})

export class ComplaintCreateComponent implements OnInit, OnDestroy {

  private fb = inject(FormBuilder);
  private complaintsService = inject(ComplaintsService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private supabaseService = inject(SupabaseService);
  private ngZone = inject(NgZone);

  complaintForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    category_id: ['', Validators.required],
    custom_category: [''],
    priority: ['medium', Validators.required],
    barangay: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]],
    latitude: [null],
    longitude: [null]
  });

  categories: any[] = [];
  showCustomCategory = false;
  loading = false;
  errorMsg = '';

  mapLoaded = false;
  barangays = MUNICIPALITY_CONFIG.barangays;

  currentStep = 1;

  mapCenter: google.maps.LatLngLiteral = {
    lat: MUNICIPALITY_CONFIG.centerLat,
    lng: MUNICIPALITY_CONFIG.centerLng
  };

  markerPosition: google.maps.LatLngLiteral | null = null;

  isVerified = false; // Assume false until checked
  verificationStatus = 'loading';
  rejectionReason = '';

  scriptElement: HTMLScriptElement | null = null;

  selectedFile: File | null = null;
  imagePreviewUrl: string | ArrayBuffer | null = null;
  formSubmitted = false;
  locating = false;
  geocoder: google.maps.Geocoder | null = null;

  ngOnInit() {
    this.checkVerificationStatus();

    this.complaintsService.getCategories().subscribe(({ data }) => {
      if (data) {
        this.categories = data;
      }
    });

    this.loadGoogleMaps();
  }

  async checkVerificationStatus() {
    // Wait for the user to be fully loaded
    const { data: { user } } = await this.supabaseService.supabase.auth.getUser();
    
    if (user) {
      const { data } = await this.supabaseService.supabase
        .from('users')
        .select('verification_status, rejection_reason, barangay')
        .eq('id', user.id)
        .single();
      
      if (data) {
        this.isVerified = data.verification_status === 'verified';
        this.verificationStatus = data.verification_status;
        this.rejectionReason = data.rejection_reason;
        
        if (this.isVerified && data.barangay) {
          this.complaintForm.patchValue({ barangay: data.barangay });
          this.complaintForm.get('barangay')?.disable();
          
          if (this.geocoder) {
            this.onBarangayChange(data.barangay);
          }
        }
      } else {
        this.isVerified = false;
        this.verificationStatus = 'pending';
      }
    } else {
      this.isVerified = false;
      this.verificationStatus = 'unauthenticated';
    }
  }

  getStepTitle(): string {
    switch(this.currentStep) {
      case 1: return 'Basic Information';
      case 2: return 'Location Details';
      case 3: return 'Additional Details & Photo';
      default: return '';
    }
  }

  onCategoryChange(categoryId: string) {
    const selectedCategory = this.categories.find(c => c.id === categoryId);
    if (selectedCategory && selectedCategory.name === 'Other') {
      this.showCustomCategory = true;
      this.complaintForm.get('custom_category')?.setValidators([Validators.required]);
    } else {
      this.showCustomCategory = false;
      this.complaintForm.get('custom_category')?.clearValidators();
      this.complaintForm.get('custom_category')?.setValue('');
    }
    this.complaintForm.get('custom_category')?.updateValueAndValidity();
  }

  nextStep() {
    // Validate current step before proceeding
    if (this.currentStep === 1) {
      const titleControl = this.complaintForm.get('title');
      const categoryControl = this.complaintForm.get('category_id');
      const customCategoryControl = this.complaintForm.get('custom_category');
      const priorityControl = this.complaintForm.get('priority');
      
      titleControl?.markAsTouched();
      categoryControl?.markAsTouched();
      if (this.showCustomCategory) {
        customCategoryControl?.markAsTouched();
      }
      priorityControl?.markAsTouched();
      
      if (titleControl?.invalid || categoryControl?.invalid || priorityControl?.invalid || (this.showCustomCategory && customCategoryControl?.invalid)) return;
    }
    
    if (this.currentStep === 2) {
      const barangayControl = this.complaintForm.get('barangay');
      const latControl = this.complaintForm.get('latitude');
      barangayControl?.markAsTouched();
      if (barangayControl?.invalid || !latControl?.value) {
        this.formSubmitted = true; // Show map error
        return;
      }
    }

    if (this.currentStep < 3) {
      this.currentStep++;
      this.formSubmitted = false; // Reset for next step
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.formSubmitted = false;
    }
  }

  ngOnDestroy() {}

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

    this.scriptElement.src =
      `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places`;

    this.scriptElement.async = true;
    this.scriptElement.defer = true;

    this.scriptElement.onload = () => this.initMap();

    document.head.appendChild(this.scriptElement);
  }

  initMap() {
    this.mapLoaded = true;
    
    if ((window as any).google?.maps?.Geocoder) {
      this.geocoder = new google.maps.Geocoder();
    }

    // We don't automatically request geolocation on init anymore to avoid annoying the user
    // Instead, if the form already has a barangay (e.g. from verification), map to it. Otherwise, set default center.
    const currentBarangay = this.complaintForm.get('barangay')?.value;
    if (currentBarangay && this.geocoder) {
      this.onBarangayChange(currentBarangay);
    } else {
      this.updateMarker(this.mapCenter);
    }
  }

  onBarangayChange(barangay: string) {
    if (!barangay || !this.geocoder) return;

    // Append the municipality and province to improve geocoding accuracy
    const searchQuery = `${barangay}, ${MUNICIPALITY_CONFIG.name}, ${MUNICIPALITY_CONFIG.province}, ${MUNICIPALITY_CONFIG.country}`;

    this.locating = true;
    this.geocoder.geocode({ address: searchQuery }, (results, status) => {
      // Must wrap in NgZone because this callback runs outside Angular's zone
      this.ngZone.run(() => {
        this.locating = false;
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          this.mapCenter = {
            lat: location.lat(),
            lng: location.lng()
          };
          this.updateMarker(this.mapCenter);
        } else {
          console.warn('Geocode was not successful for the following reason: ' + status);
        }
      });
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
        this.mapCenter = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        this.updateMarker(this.mapCenter);
      },
      (error) => {
        this.locating = false;
        console.warn('Geolocation error:', error);
        if (error.code === error.PERMISSION_DENIED) {
           this.errorMsg = 'Location permission was denied. Please drag the marker manually or enable location permissions.';
        } else {
           this.errorMsg = 'Failed to get your current location. Please drag the marker manually.';
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  onMapClick(event: google.maps.MapMouseEvent) {

    if (event.latLng) {
      this.updateMarker(event.latLng.toJSON());
    }
  }

  onMarkerDragEnd(event: google.maps.MapMouseEvent) {

    if (event.latLng) {
      this.updateMarker(event.latLng.toJSON());
    }
  }

  updateMarker(position: google.maps.LatLngLiteral) {

    this.markerPosition = position;

    this.complaintForm.patchValue({
      latitude: position.lat,
      longitude: position.lng
    });
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
        console.error(err);
      }
    }
  }

  /**
   * Compresses the image using HTML5 Canvas to ensure it stays well under 5MB.
   * Resizes large images proportionally.
   */
  compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Canvas context not found'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert back to File, adjusting quality to ~70%
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob failed'));
              return;
            }
            // Use the original filename but enforce webp or jpeg for smaller size
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpeg"), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          }, 'image/jpeg', 0.7);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  removeFile(event: Event) {
    event.stopPropagation();
    this.selectedFile = null;
    this.imagePreviewUrl = null;
  }

  async onSubmit() {
    this.formSubmitted = true;

    if (this.complaintForm.invalid || !this.selectedFile) {
      // Form is invalid or missing the mandatory photo
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    const user = this.authService.user;

    if (!user) return;

    let image_url = null;

    if (this.selectedFile) {
      const fileExt = this.selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { url, error } = await this.supabaseService.uploadFile('complaint_images', filePath, this.selectedFile);
      
      if (error) {
        this.loading = false;
        this.errorMsg = 'Failed to upload image: ' + error.message;
        return;
      }
      
      image_url = url;
    }

    const payload = {
      ...this.complaintForm.getRawValue(),
      created_by: user.id,
      image_url: image_url
    };

    this.complaintsService.createComplaint(payload).subscribe({

      next: ({ error }) => {

        this.loading = false;

        if (error) {
          this.errorMsg = error.message;
        } else {
          this.router.navigate(['/citizen/complaints']);
        }
      },

      error: (err) => {

        this.loading = false;
        this.errorMsg = err.message;
      }
    });
  }
}