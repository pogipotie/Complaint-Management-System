import { Component, Inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-status-update-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule,
    MatIconModule
  ],
  template: `
    <div class="bg-white rounded">
      <div mat-dialog-title class="pt-6 pb-4 px-6 sm:px-8 border-b border-gray-100 m-0">
        <h2 class="text-xl font-bold text-gray-900 leading-tight">Update Status</h2>
      </div>
      
      <mat-dialog-content class="!p-6 sm:!p-8">
        <p class="mb-5 text-sm text-gray-600">
          You are changing the status to 
          <strong class="uppercase text-indigo-600 tracking-wide">{{ data.newStatus.replace('_', ' ') }}</strong>.
        </p>
        
        <form [formGroup]="statusForm">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Add a comment or resolution note (Optional)</mat-label>
            <textarea matInput formControlName="note" rows="4" placeholder="This note will be visible to the citizen..."></textarea>
          </mat-form-field>

          <!-- Before & After Photo Upload (Only for Resolved) -->
          <div *ngIf="data.newStatus === 'resolved'" class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Resolution Photo Proof <span class="text-red-500">*</span></label>
            <div 
              class="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
              (click)="!selectedFile && fileInput.click()"
              [class.bg-gray-50]="!!selectedFile"
            >
              <input type="file" #fileInput class="hidden" accept="image/jpeg, image/png, image/webp" (change)="onFileSelected($event)">
              
              <ng-container *ngIf="!selectedFile">
                <mat-icon class="text-gray-400 text-3xl mb-2">add_a_photo</mat-icon>
                <p class="text-sm text-gray-600 font-medium">Click to upload 'After' photo</p>
                <p class="text-xs text-gray-400 mt-1">Provide visual proof that the issue was resolved.</p>
              </ng-container>

              <ng-container *ngIf="selectedFile">
                <div class="flex items-center w-full gap-4">
                  <img [src]="imagePreviewUrl" class="w-16 h-16 rounded object-cover border border-gray-200" alt="Preview">
                  <div class="flex-1 flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-700 truncate">{{ selectedFile.name }}</span>
                    <button mat-icon-button type="button" (click)="removeFile($event)" color="warn">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                </div>
              </ng-container>
            </div>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="!px-6 sm:!px-8 !pb-6 !pt-2 m-0 border-t border-gray-100">
        <button mat-button mat-dialog-close class="h-10 px-4 rounded font-medium mr-2 text-gray-600">Cancel</button>
        <button mat-flat-button color="primary" (click)="confirm()" [disabled]="data.newStatus === 'resolved' && !selectedFile" class="h-10 px-6 rounded font-medium disabled:opacity-50">
          Confirm Update
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
export class AdminStatusUpdateDialogComponent {
  statusForm: FormGroup;
  selectedFile: File | null = null;
  imagePreviewUrl: string | ArrayBuffer | null = null;

  constructor(
    public dialogRef: MatDialogRef<AdminStatusUpdateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.statusForm = this.fb.group({
      note: [this.data.complaint.resolution_notes || '']
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
        console.error('Failed to compress image', err);
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

  confirm() {
    this.dialogRef.close({ 
      proceed: true, 
      note: this.statusForm.value.note,
      resolutionFile: this.selectedFile
    });
  }
}