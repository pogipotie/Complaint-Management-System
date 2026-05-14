import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-admin-user-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule
  ],
  template: `
    <div class="border-4 border-gray-900 bg-white relative max-h-[90vh] flex flex-col shadow-[8px_8px_0px_0px_rgba(17,24,39,1)]">
      
      <!-- Header -->
      <div class="flex justify-between items-center p-4 sm:p-6 border-b-4 border-gray-900 bg-primary-50 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-sm bg-primary-100 border-2 border-gray-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
            <mat-icon color="primary">account_box</mat-icon>
          </div>
          <div>
            <h2 class="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight m-0" style="font-family: 'Arial Black', Impact, sans-serif;">
              Citizen Details
            </h2>
            <p class="text-xs font-bold text-gray-600 uppercase tracking-widest mt-1">
              Registration Verification
            </p>
          </div>
        </div>
        <button mat-icon-button (click)="close()" class="!border-2 !border-gray-900 !bg-white !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Column 1: Personal Info -->
          <div class="space-y-6">
            <div class="bg-white border-2 border-gray-900 rounded-sm p-4 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
              <h3 class="text-sm font-black text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 pb-2 mb-4 flex items-center gap-2">
                <mat-icon class="scale-75 text-primary-600">person</mat-icon> Personal Information
              </h3>
              
              <div class="space-y-3">
                <div class="grid grid-cols-2 gap-2">
                  <span class="text-xs font-bold text-gray-500 uppercase">Full Name</span>
                  <span class="text-sm font-black text-gray-900 uppercase">{{ data.user.full_name }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <span class="text-xs font-bold text-gray-500 uppercase">Date of Birth</span>
                  <span class="text-sm font-bold text-gray-900">{{ data.user.date_of_birth | date:'longDate' }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <span class="text-xs font-bold text-gray-500 uppercase">Gender</span>
                  <span class="text-sm font-bold text-gray-900">{{ data.user.gender }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <span class="text-xs font-bold text-gray-500 uppercase">Civil Status</span>
                  <span class="text-sm font-bold text-gray-900">{{ data.user.civil_status }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <span class="text-xs font-bold text-gray-500 uppercase">Occupation</span>
                  <span class="text-sm font-bold text-gray-900">{{ data.user.occupation || 'N/A' }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <span class="text-xs font-bold text-gray-500 uppercase">PWD Status</span>
                  <span class="text-sm font-black uppercase px-2 py-0.5 rounded-sm border-2 border-gray-900 shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] inline-block w-max"
                        [ngClass]="data.user.is_pwd ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'">
                    {{ data.user.is_pwd ? 'Yes' : 'No' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="bg-white border-2 border-gray-900 rounded-sm p-4 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
              <h3 class="text-sm font-black text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 pb-2 mb-4 flex items-center gap-2">
                <mat-icon class="scale-75 text-primary-600">contact_phone</mat-icon> Contact & Emergency
              </h3>
              
              <div class="space-y-3">
                <div class="grid grid-cols-2 gap-2">
                  <span class="text-xs font-bold text-gray-500 uppercase">Primary Phone</span>
                  <span class="text-sm font-bold text-gray-900">{{ data.user.phone }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <span class="text-xs font-bold text-gray-500 uppercase">Emergency Name</span>
                  <span class="text-sm font-bold text-gray-900">{{ data.user.emergency_contact_name || 'N/A' }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <span class="text-xs font-bold text-gray-500 uppercase">Emergency Phone</span>
                  <span class="text-sm font-bold text-gray-900">{{ data.user.emergency_contact_number || 'N/A' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Column 2: Address & ID -->
          <div class="space-y-6">
            <div class="bg-white border-2 border-gray-900 rounded-sm p-4 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
              <h3 class="text-sm font-black text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 pb-2 mb-4 flex items-center gap-2">
                <mat-icon class="scale-75 text-primary-600">home</mat-icon> Residency
              </h3>
              
              <div class="space-y-3">
                <div class="grid grid-cols-2 gap-2">
                  <span class="text-xs font-bold text-gray-500 uppercase">Barangay</span>
                  <span class="text-sm font-black text-gray-900 uppercase">{{ data.user.barangay }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <span class="text-xs font-bold text-gray-500 uppercase">Street Address</span>
                  <span class="text-sm font-bold text-gray-900">{{ data.user.street_address }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <span class="text-xs font-bold text-gray-500 uppercase">Residency Type</span>
                  <span class="text-sm font-bold text-gray-900">{{ data.user.residency_type || 'N/A' }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <span class="text-xs font-bold text-gray-500 uppercase">Years Residing</span>
                  <span class="text-sm font-bold text-gray-900">{{ data.user.years_of_residency ? data.user.years_of_residency + ' Years' : 'N/A' }}</span>
                </div>
              </div>
            </div>

            <div class="bg-white border-2 border-gray-900 rounded-sm p-4 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
              <h3 class="text-sm font-black text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 pb-2 mb-4 flex items-center gap-2">
                <mat-icon class="scale-75 text-primary-600">badge</mat-icon> Proof of Residency
              </h3>
              
              <div class="mt-2 border-2 border-dashed border-gray-300 rounded-sm p-2 flex flex-col items-center justify-center bg-gray-50 min-h-[200px]">
                <img *ngIf="data.user.proof_of_residency_url" [src]="data.user.proof_of_residency_url" class="max-h-[250px] object-contain border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] cursor-pointer" alt="ID Image" (click)="openImage(data.user.proof_of_residency_url)">
                <div *ngIf="!data.user.proof_of_residency_url" class="text-sm text-gray-400 font-medium italic">
                  No ID Uploaded
                </div>
                <p *ngIf="data.user.proof_of_residency_url" class="text-[10px] font-bold text-gray-500 uppercase mt-4 text-center">
                  Click image to open in new tab
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      <!-- Actions Footer (Standard) -->
      <div *ngIf="actionMode === 'none'" class="p-4 sm:p-6 border-t-4 border-gray-900 bg-white shrink-0 flex flex-col sm:flex-row justify-between gap-4">
        <span class="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-sm border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] self-start sm:self-center"
              [ngClass]="{
                'bg-yellow-100 text-yellow-800': data.user.verification_status === 'pending',
                'bg-green-100 text-green-800': data.user.verification_status === 'verified',
                'bg-red-100 text-red-800': data.user.verification_status === 'rejected',
                'bg-gray-800 text-white': data.user.verification_status === 'banned'
              }">
          Current Status: {{ data.user.verification_status || 'pending' }}
        </span>
        
        <div class="flex gap-3 w-full sm:w-auto" *ngIf="data.user.verification_status !== 'verified' && data.user.verification_status !== 'banned'">
          <button mat-flat-button color="warn" class="flex-1 sm:flex-none !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider" (click)="actionMode = 'reject'">
            <mat-icon>close</mat-icon> Reject
          </button>
          <button mat-flat-button class="flex-1 sm:flex-none !bg-green-500 hover:!bg-green-600 text-white !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider" (click)="close('verified')">
            <mat-icon>check</mat-icon> Verify
          </button>
        </div>

        <div class="flex gap-3 w-full sm:w-auto" *ngIf="data.user.verification_status === 'verified'">
          <button mat-flat-button color="warn" class="w-full sm:w-auto !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider" (click)="actionMode = 'ban'">
            <mat-icon>block</mat-icon> Ban User
          </button>
        </div>

        <div class="flex gap-3 w-full sm:w-auto" *ngIf="data.user.verification_status === 'banned'">
          <button mat-flat-button class="w-full sm:w-auto !bg-gray-200 hover:!bg-gray-300 !text-gray-900 !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider" (click)="close('verified')">
            <mat-icon>restore</mat-icon> Lift Ban
          </button>
        </div>
      </div>

      <!-- Reject / Ban Form Overlay -->
      <div *ngIf="actionMode === 'reject' || actionMode === 'ban'" class="p-4 sm:p-6 border-t-4 border-gray-900 bg-red-50 shrink-0">
        <h3 class="text-lg font-black text-red-900 uppercase tracking-tight mb-4 flex items-center gap-2" style="font-family: 'Arial Black', Impact, sans-serif;">
          <mat-icon>{{ actionMode === 'ban' ? 'block' : 'gpp_bad' }}</mat-icon> Reason for {{ actionMode === 'ban' ? 'Banning' : 'Rejection' }}
        </h3>
        
        <div class="grid grid-cols-1 gap-4 mb-4">
          <mat-form-field appearance="outline" class="w-full bg-white">
            <mat-label>Select Reason</mat-label>
            <mat-select [(ngModel)]="selectedReason">
              <mat-option *ngFor="let reason of (actionMode === 'ban' ? banReasons : rejectReasons)" [value]="reason">{{ reason }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full bg-white" *ngIf="selectedReason === 'Other'">
            <mat-label>Specify Custom Reason</mat-label>
            <textarea matInput [(ngModel)]="customReason" rows="2" placeholder="Explain why this user is being {{ actionMode === 'ban' ? 'banned' : 'rejected' }}..."></textarea>
          </mat-form-field>
        </div>

        <div class="flex justify-end gap-3">
          <button mat-stroked-button (click)="actionMode = 'none'" class="!rounded-sm !border-2 !border-gray-900 !bg-white !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider">
            Cancel
          </button>
          <button mat-flat-button color="warn" [disabled]="!selectedReason || (selectedReason === 'Other' && !customReason)" class="!rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider" (click)="confirmAction()">
            Confirm {{ actionMode === 'ban' ? 'Ban' : 'Rejection' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 8px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #f3f4f6; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
  `]
})
export class AdminUserDetailDialogComponent {
  actionMode: 'none' | 'reject' | 'ban' = 'none';
  selectedReason = '';
  customReason = '';

  rejectReasons = [
    'Invalid or unreadable ID',
    'Address outside municipality jurisdiction',
    'Mismatched information',
    'Suspected duplicate or fraudulent account',
    'Other'
  ];

  banReasons = [
    'Violation of community terms',
    'Abusive behavior',
    'Submitting fake complaints/spam',
    'Impersonation',
    'Other'
  ];

  constructor(
    public dialogRef: MatDialogRef<AdminUserDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data.startInRejectMode) {
      this.actionMode = 'reject';
    } else if (this.data.startInBanMode) {
      this.actionMode = 'ban';
    }
  }

  close(action?: 'verified' | 'rejected' | 'banned', reason?: string) {
    this.dialogRef.close({ action, reason });
  }

  confirmAction() {
    const finalReason = this.selectedReason === 'Other' 
      ? this.customReason 
      : this.selectedReason;
      
    this.close(this.actionMode === 'ban' ? 'banned' : 'rejected', finalReason);
  }

  openImage(url: string) {
    if (url) {
      window.open(url, '_blank');
    }
  }
}