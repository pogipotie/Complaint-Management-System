import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MUNICIPALITY_CONFIG } from '../../../core/constants/municipality.config';

@Component({
  selector: 'app-admin-create-captain-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule,
    MatSelectModule,
    MatIconModule
  ],
  template: `
    <div class="bg-white rounded">
      <div mat-dialog-title class="pt-6 pb-4 px-6 sm:px-8 border-b border-gray-100 m-0">
        <h2 class="text-xl font-bold text-gray-900 leading-tight">Create Barangay Captain Account</h2>
      </div>
      
      <mat-dialog-content class="!p-6 sm:!p-8">
        <p class="mb-5 text-sm text-gray-600">
          Provide details below to generate a new Captain account. They will be immediately verified.
        </p>
        
        <form [formGroup]="captainForm" class="space-y-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Full Name</mat-label>
            <input matInput formControlName="fullName" placeholder="e.g. Hon. Juan Dela Cruz">
            <mat-error *ngIf="captainForm.get('fullName')?.hasError('required')">Name is required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Email Address</mat-label>
            <input matInput type="email" formControlName="email" placeholder="captain@barangay.gov.ph">
            <mat-error *ngIf="captainForm.get('email')?.hasError('required')">Email is required</mat-error>
            <mat-error *ngIf="captainForm.get('email')?.hasError('email')">Must be a valid email</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Temporary Password</mat-label>
            <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password">
            <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
              <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
            </button>
            <mat-error *ngIf="captainForm.get('password')?.hasError('required')">Password is required</mat-error>
            <mat-error *ngIf="captainForm.get('password')?.hasError('minlength')">Must be at least 6 characters</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Assigned Barangay</mat-label>
            <mat-select formControlName="barangay">
              <mat-option *ngFor="let brgy of barangays" [value]="brgy">
                {{ brgy }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="captainForm.get('barangay')?.hasError('required')">Barangay is required</mat-error>
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="!px-6 sm:!px-8 !pb-6 !pt-2 m-0 border-t border-gray-100">
        <button mat-button mat-dialog-close class="h-10 px-4 rounded font-medium mr-2 text-gray-600">Cancel</button>
        <button mat-flat-button color="primary" (click)="confirm()" [disabled]="captainForm.invalid" class="h-10 px-6 rounded font-medium">
          Create Account
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    :host { display: block; }
    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface { padding: 0 !important; border-radius: 4px !important; }
  `]
})
export class AdminCreateCaptainDialogComponent {
  private fb = inject(FormBuilder);
  public dialogRef = inject(MatDialogRef<AdminCreateCaptainDialogComponent>);
  
  hidePassword = true;
  barangays = MUNICIPALITY_CONFIG.barangays;

  captainForm: FormGroup = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    barangay: ['', Validators.required]
  });

  confirm() {
    if (this.captainForm.valid) {
      this.dialogRef.close(this.captainForm.value);
    }
  }
}
