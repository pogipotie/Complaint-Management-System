import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface DescriptionDialogData {
  title: string;
  description: string;
}

@Component({
  selector: 'app-description-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="border-4 border-gray-900 bg-white shadow-[8px_8px_0px_0px_rgba(17,24,39,1)] flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="bg-primary-300 px-6 py-4 border-b-4 border-gray-900 flex justify-between items-center shrink-0">
        <div>
          <h2 class="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight m-0 leading-none" style="font-family: 'Arial Black', Impact, sans-serif;">
            Resident Description
          </h2>
          <p class="text-xs font-bold text-gray-800 uppercase tracking-widest mt-1 mb-0">{{ data.title }}</p>
        </div>
        <button mat-icon-button (click)="dialogRef.close()" class="!border-2 !border-gray-900 bg-white hover:bg-gray-100 !rounded-sm !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all">
          <mat-icon class="text-gray-900">close</mat-icon>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto custom-scrollbar bg-gray-50 flex-1">
        <div class="bg-white p-5 border-2 border-gray-900 rounded-sm shadow-[4px_4px_0px_0px_rgba(17,24,39,1)]">
          <p class="text-sm md:text-base font-bold text-gray-800 leading-relaxed whitespace-pre-wrap m-0 uppercase tracking-wider">{{ data.description }}</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t-4 border-gray-900 bg-white flex justify-end shrink-0">
        <button mat-flat-button color="primary" (click)="dialogRef.close()" class="!h-12 !px-8 !rounded-sm !border-2 !border-gray-900 !shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[2px] hover:!translate-x-[2px] hover:!shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider">
          Close
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f8fafc;
      border-left: 2px solid #111827;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: #111827;
      border: 2px solid #111827;
    }
  `]
})
export class DescriptionDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DescriptionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DescriptionDialogData
  ) {}
}
