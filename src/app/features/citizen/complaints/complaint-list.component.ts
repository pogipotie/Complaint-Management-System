import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComplaintsService } from '../../../core/services/complaints.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ComplaintDetailDialogComponent } from './complaint-detail-dialog.component';
import { ComplaintEditDialogComponent } from './complaint-edit-dialog.component';
import { ComplaintDeleteDialogComponent } from './complaint-delete-dialog.component';

@Component({
  selector: 'app-complaint-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatChipsModule, 
    MatDividerModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatDialogModule
  ],
  template: `
    <div class="space-y-6 pb-12">
      <!-- Header & Announcements Section -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 class="text-3xl font-black leading-7 text-gray-900 sm:truncate sm:tracking-tight uppercase" style="font-family: 'Arial Black', Impact, sans-serif;">My Complaints</h2>
          <p class="mt-2 text-sm font-bold text-gray-600 uppercase tracking-widest">Track the status of your reported issues.</p>
        </div>
        <div>
          <button mat-flat-button color="primary" routerLink="/citizen/complaints/new" class="!h-12 !px-6 !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider">
            <mat-icon class="mr-2">add</mat-icon>
            Report Issue
          </button>
        </div>
      </div>
      
      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    
      <!-- Complaints Grid & Paginator -->
      <div *ngIf="!loading && complaints.length > 0" class="flex flex-col space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let complaint of paginatedComplaints" class="relative group h-full">
            <!-- Retro offset shadow effect -->
            <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
            
            <!-- Main Card -->
            <div class="relative bg-white border-2 border-gray-900 rounded-sm overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
              
              <!-- Window Header -->
              <div class="h-10 border-b-2 border-gray-900 flex items-center justify-between px-4 shrink-0 bg-gray-50">
                <span class="font-bold text-[11px] tracking-wider text-gray-900 uppercase">
                  ID: {{ complaint.id.substring(0,8) }}
                </span>
                <span class="inline-flex px-2 py-0.5 border border-gray-900 rounded-sm text-[10px] font-bold tracking-wide uppercase"
                  [ngClass]="{
                    'bg-yellow-200': complaint.status === 'pending',
                    'bg-blue-200': complaint.status === 'assigned',
                    'bg-primary-200': complaint.status === 'in_progress',
                    'bg-green-200': complaint.status === 'resolved',
                    'bg-gray-200': complaint.status === 'closed',
                    'bg-red-200': complaint.status === 'rejected'
                  }">
                  {{ complaint.status.replace('_', ' ') }}
                </span>
              </div>

              <!-- Content Body -->
              <div class="p-6 flex-1 flex flex-col">
                <div class="flex items-start gap-4 mb-4">
                  <div class="bg-primary-100 border-2 border-gray-900 text-primary-900 rounded-full flex items-center justify-center h-12 w-12 shrink-0">
                    <mat-icon>{{ getCategoryIcon(complaint.complaint_categories?.name) }}</mat-icon>
                  </div>
                  <div class="min-w-0 flex-1">
                    <h3 class="text-lg font-black text-gray-900 truncate tracking-tight uppercase" [title]="complaint.title" style="font-family: 'Arial Black', Impact, sans-serif;">
                      {{ complaint.title }}
                    </h3>
                    <p class="text-xs font-bold text-gray-600 mt-1 uppercase tracking-wider">
                      {{ complaint.created_at | date:'MMM dd, yyyy' }}
                    </p>
                  </div>
                </div>

                <p class="text-gray-800 text-sm font-medium line-clamp-3 mb-6 flex-1 leading-relaxed">
                  {{ complaint.description }}
                </p>

                <div class="space-y-2 mb-6">
                  <div class="flex items-center text-xs font-bold text-gray-600 w-full overflow-hidden uppercase tracking-wider">
                    <mat-icon class="scale-[0.6] -ml-1 mr-1 shrink-0 text-gray-900">folder</mat-icon>
                    <span class="truncate">{{ complaint.custom_category || complaint.complaint_categories?.name || 'Uncategorized' }}</span>
                  </div>
                  <div class="flex items-center text-xs font-bold text-gray-600 w-full overflow-hidden uppercase tracking-wider">
                    <mat-icon class="scale-[0.6] -ml-1 mr-1 shrink-0 text-gray-900">location_on</mat-icon>
                    <span class="truncate">{{ complaint.barangay }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Actions Footer -->
              <div class="p-4 border-t-2 border-gray-900 bg-gray-50 flex justify-between items-center shrink-0">
                <div class="flex items-center gap-1">
                  <button *ngIf="complaint.status === 'pending'" mat-icon-button color="warn" (click)="openDelete(complaint)" matTooltip="Delete Complaint" class="scale-90">
                    <mat-icon>delete</mat-icon>
                  </button>
                  <button *ngIf="complaint.status === 'pending'" mat-icon-button color="primary" (click)="openEdit(complaint)" matTooltip="Edit Complaint" class="scale-90">
                    <mat-icon>edit</mat-icon>
                  </button>
                </div>
                <button mat-button color="primary" (click)="openDetails(complaint)" class="font-bold">
                  Details
                  <mat-icon iconPositionEnd>arrow_forward</mat-icon>
                </button>
              </div>

            </div>
          </div>
        </div>

        <mat-paginator
          [length]="complaints.length"
          [pageSize]="pageSize"
          [pageSizeOptions]="[5, 10, 25]"
          (page)="onPageChange($event)"
          class="bg-white border-2 border-gray-900 rounded-sm shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] mt-8"
        ></mat-paginator>
      </div>

      <div *ngIf="!loading && complaints.length === 0" class="border-2 border-gray-900 bg-white rounded-sm shadow-[4px_4px_0px_0px_rgba(17,24,39,1)]">
        <div class="flex flex-col items-center justify-center min-h-[400px] w-full text-center px-6 py-12">
          <div class="bg-primary-100 border-2 border-gray-900 p-6 rounded-full mb-6 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
            <mat-icon class="h-16 w-16 text-primary-900 flex items-center justify-center" style="font-size: 64px; height: 64px; width: 64px;">post_add</mat-icon>
          </div>
          <h3 class="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">No complaints reported yet</h3>
          <p class="text-sm font-bold text-gray-600 max-w-md w-full text-center mb-8 uppercase tracking-wider leading-relaxed">
            You haven't submitted any issues to the municipality. If you see a problem in your community, report it here.
          </p>
          <button mat-flat-button color="primary" routerLink="/citizen/complaints/new" class="!h-12 !px-8 !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider">
            Report an Issue
          </button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    /* Removed legacy CSS overrides to let Tailwind flex classes handle alignment cleanly */
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: #bfdbfe; /* blue-200 */
      border-radius: 4px;
    }
  `]
})
export class ComplaintListComponent implements OnInit {
  private complaintsService = inject(ComplaintsService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  complaints: any[] = [];
  paginatedComplaints: any[] = [];
  loading = true;

  pageSize = 5;
  pageIndex = 0;

  ngOnInit() {
    const user = this.authService.user;
    if (user) {
      this.complaintsService.getComplaints(user.id).subscribe({
        next: ({ data, error }) => {
          this.loading = false;
          if (!error && data) {
            this.complaints = data;
            this.updatePagination();
          }
        },
        error: () => {
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  updatePagination() {
    const startIndex = this.pageIndex * this.pageSize;
    this.paginatedComplaints = this.complaints.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagination();
  }

  openDetails(complaint: any) {
    this.dialog.open(ComplaintDetailDialogComponent, {
      data: complaint,
      width: '650px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'modern-dialog',
      autoFocus: false
    });
  }

  openEdit(complaint: any) {
    const dialogRef = this.dialog.open(ComplaintEditDialogComponent, {
      data: complaint,
      width: '650px',
      maxWidth: '95vw',
      panelClass: 'modern-dialog',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(updatedComplaint => {
      if (updatedComplaint) {
        const index = this.complaints.findIndex(c => c.id === updatedComplaint.id);
        if (index !== -1) {
          this.complaints[index] = updatedComplaint;
          this.updatePagination(); 
        }
      }
    });
  }

  openDelete(complaint: any) {
    const dialogRef = this.dialog.open(ComplaintDeleteDialogComponent, {
      data: complaint,
      width: '450px',
      maxWidth: '95vw',
      panelClass: 'modern-dialog',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(deleted => {
      if (deleted) {
        // Remove the complaint from the array
        this.complaints = this.complaints.filter(c => c.id !== complaint.id);
        
        // If we deleted the last item on a page, we might need to go back a page
        const maxPageIndex = Math.ceil(this.complaints.length / this.pageSize) - 1;
        if (this.pageIndex > maxPageIndex) {
          this.pageIndex = Math.max(0, maxPageIndex);
        }
        
        this.updatePagination(); 
      }
    });
  }

  getCategoryIcon(categoryName: string): string {
    if (!categoryName) return 'report_problem';
    const name = categoryName.toLowerCase();
    
    if (name.includes('road') || name.includes('pothole')) return 'edit_road';
    if (name.includes('garbage') || name.includes('waste')) return 'delete_outline';
    if (name.includes('noise')) return 'volume_up';
    if (name.includes('health') || name.includes('sanitation')) return 'medical_services';
    if (name.includes('flood') || name.includes('drainage')) return 'water_drop';
    if (name.includes('traffic')) return 'traffic';
    if (name.includes('light')) return 'lightbulb';
    
    return 'report_problem'; // Default fallback
  }
}
