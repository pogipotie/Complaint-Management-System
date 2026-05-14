import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ComplaintsService } from '../../../core/services/complaints.service';

@Component({
  selector: 'app-complaint-delete-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatDialogModule, 
    MatButtonModule, 
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <div class="relative bg-white rounded">
      <!-- Header -->
      <div mat-dialog-title class="pt-6 pb-4 px-6 sm:px-8 border-b border-gray-100 m-0 bg-white sticky top-0 z-20">
        <h2 class="text-xl sm:text-2xl font-bold text-red-600 flex items-center gap-2">
          <mat-icon>warning</mat-icon> Delete Complaint
        </h2>
      </div>

      <!-- Content -->
      <mat-dialog-content class="mat-typography !p-6 sm:!p-8">
        <div class="space-y-4">
          <p class="text-gray-700 text-base">
            You are about to permanently delete the complaint: 
            <span class="font-bold block mt-1 text-gray-900">"{{ data.title }}"</span>
          </p>
          
          <div class="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-800">
            <strong>Warning:</strong> This action cannot be undone. All associated data, including images and location details, will be permanently removed from the system.
          </div>

          <form [formGroup]="deleteForm" class="pt-4">
            <p class="text-sm font-medium text-gray-700 mb-2">To proceed, please type <span class="font-bold select-none">confirm</span> below:</p>
            <mat-form-field appearance="outline" class="w-full">
              <input matInput formControlName="confirmation" placeholder="Type confirm" autocomplete="off">
              <mat-error *ngIf="deleteForm.get('confirmation')?.hasError('pattern')">
                You must type "confirm" exactly.
              </mat-error>
            </mat-form-field>
          </form>

          <!-- Error -->
          <div *ngIf="errorMsg" class="flex gap-3 items-start p-4 rounded bg-red-50 border border-red-200">
            <mat-icon class="text-red-500">error_outline</mat-icon>
            <div>
              <h4 class="font-semibold text-red-800">Deletion Failed</h4>
              <p class="text-sm text-red-700 mt-1">{{ errorMsg }}</p>
            </div>
          </div>
        </div>
      </mat-dialog-content>

      <!-- Actions -->
      <mat-dialog-actions align="end" class="!px-6 sm:!px-8 !pb-6 !pt-4 border-t border-gray-100 m-0">
        <button mat-button mat-dialog-close [disabled]="isDeleting" class="h-10 px-4 rounded font-medium mr-2 text-gray-600">Cancel</button>
        <button mat-flat-button color="warn" (click)="confirmDelete()" [disabled]="deleteForm.invalid || isDeleting" class="h-10 px-6 rounded font-medium">
          <mat-icon *ngIf="isDeleting" class="animate-spin mr-2">autorenew</mat-icon>
          {{ isDeleting ? 'Deleting...' : 'Delete Permanently' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
      padding: 0 !important;
      border-radius: 4px !important;
    }
  `]
})
export class ComplaintDeleteDialogComponent {
  isDeleting = false;
  errorMsg = '';
  deleteForm: FormGroup;
  private complaintsService = inject(ComplaintsService);

  constructor(
    public dialogRef: MatDialogRef<ComplaintDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.deleteForm = this.fb.group({
      confirmation: ['', [Validators.required, Validators.pattern('^confirm$')]]
    });
  }

  confirmDelete() {
    if (this.deleteForm.invalid) return;

    this.isDeleting = true;
    this.errorMsg = '';

    this.complaintsService.deleteComplaint(this.data.id).subscribe({
      next: ({ error }) => {
        this.isDeleting = false;
        if (!error) {
          // Pass back true to indicate successful deletion
          this.dialogRef.close(true);
        } else {
          this.errorMsg = error.message;
          console.error('Failed to delete complaint:', error);
        }
      },
      error: (err) => {
        this.isDeleting = false;
        this.errorMsg = err.message;
        console.error(err);
      }
    });
  }
}