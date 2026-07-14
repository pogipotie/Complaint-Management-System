import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplaintsService } from '../../../core/services/complaints.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { RealtimeService } from '../../../core/services/realtime.service';
import { Subscription } from 'rxjs';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { ComplaintDetailDialogComponent } from '../../citizen/complaints/complaint-detail-dialog.component';
import { AdminStatusUpdateDialogComponent } from './admin-status-update-dialog.component';

@Component({
  selector: 'app-admin-complaints',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule
  ],
  template: `
    <div class="space-y-6">
      <!-- Toolbar -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div class="relative w-full sm:max-w-md">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <mat-icon class="text-gray-400 scale-90">search</mat-icon>
          </div>
          <input type="text" (keyup)="applyFilter($event)" placeholder="Search complaints..." class="w-full pl-10 pr-10 py-3 rounded-sm border-2 border-gray-900 focus:ring-0 focus:border-primary-600 outline-none transition-colors bg-white shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] font-bold text-gray-900 placeholder-gray-500" #searchInput>
          <div class="absolute inset-y-0 right-0 pr-1 flex items-center" *ngIf="isFiltering">
            <button mat-icon-button aria-label="Clear" (click)="clearFilter(searchInput)" class="text-gray-400 hover:text-gray-900 scale-90">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>
        
        <div class="flex space-x-3 w-full sm:w-auto">
          <button mat-stroked-button color="primary" (click)="exportToCsv()" class="!h-12 w-full sm:w-auto !rounded-sm !border-2 !border-gray-900 !shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[2px] hover:!translate-x-[2px] hover:!shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider bg-white">
            <mat-icon>download</mat-icon>
            Export CSV
          </button>
          <button mat-flat-button color="primary" (click)="showFilters = !showFilters" class="!h-12 w-full sm:w-auto !rounded-sm !border-2 !border-gray-900 !shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[2px] hover:!translate-x-[2px] hover:!shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider">
            <mat-icon>filter_list</mat-icon>
            Filter
          </button>
        </div>
      </div>

      <!-- Advanced Filters Row -->
      <div *ngIf="showFilters" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-gray-50 border-2 border-gray-900 rounded-sm shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] animate-in fade-in slide-in-from-top-2 duration-200">
        <!-- Barangay Filter -->
        <div class="space-y-1.5">
          <label class="text-[10px] font-black uppercase tracking-widest text-gray-600">Barangay</label>
          <div class="relative">
            <select [(ngModel)]="filterValues.barangay" (change)="applyAllFilters()" class="w-full appearance-none bg-white border-2 border-gray-900 rounded-sm pl-3 pr-8 py-2 text-xs font-bold uppercase tracking-wider text-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] focus:outline-none focus:ring-0 focus:border-primary-600 cursor-pointer">
              <option value="">ALL BARANGAYS</option>
              <option *ngFor="let brgy of barangays" [value]="brgy">{{ brgy }}</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-900">
              <mat-icon class="scale-75">expand_more</mat-icon>
            </div>
          </div>
        </div>

        <!-- Category Filter -->
        <div class="space-y-1.5">
          <label class="text-[10px] font-black uppercase tracking-widest text-gray-600">Category</label>
          <div class="relative">
            <select [(ngModel)]="filterValues.category" (change)="applyAllFilters()" class="w-full appearance-none bg-white border-2 border-gray-900 rounded-sm pl-3 pr-8 py-2 text-xs font-bold uppercase tracking-wider text-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] focus:outline-none focus:ring-0 focus:border-primary-600 cursor-pointer">
              <option value="">ALL CATEGORIES</option>
              <option *ngFor="let cat of availableCategories" [value]="cat">{{ cat }}</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-900">
              <mat-icon class="scale-75">expand_more</mat-icon>
            </div>
          </div>
        </div>

        <!-- Priority Filter -->
        <div class="space-y-1.5">
          <label class="text-[10px] font-black uppercase tracking-widest text-gray-600">Priority</label>
          <div class="relative">
            <select [(ngModel)]="filterValues.priority" (change)="applyAllFilters()" class="w-full appearance-none bg-white border-2 border-gray-900 rounded-sm pl-3 pr-8 py-2 text-xs font-bold uppercase tracking-wider text-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] focus:outline-none focus:ring-0 focus:border-primary-600 cursor-pointer">
              <option value="">ALL PRIORITIES</option>
              <option value="low">LOW</option>
              <option value="medium">MEDIUM</option>
              <option value="high">HIGH</option>
              <option value="emergency">EMERGENCY</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-900">
              <mat-icon class="scale-75">expand_more</mat-icon>
            </div>
          </div>
        </div>

        <!-- Status Filter -->
        <div class="space-y-1.5">
          <label class="text-[10px] font-black uppercase tracking-widest text-gray-600">Status</label>
          <div class="relative">
            <select [(ngModel)]="filterValues.status" (change)="applyAllFilters()" class="w-full appearance-none bg-white border-2 border-gray-900 rounded-sm pl-3 pr-8 py-2 text-xs font-bold uppercase tracking-wider text-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] focus:outline-none focus:ring-0 focus:border-primary-600 cursor-pointer">
              <option value="">ALL STATUSES</option>
              <option value="pending">PENDING</option>
              <option value="assigned">ASSIGNED</option>
              <option value="in_progress">IN PROGRESS</option>
              <option value="resolved">RESOLVED</option>
              <option value="closed">CLOSED</option>
              <option value="rejected">REJECTED</option>
              <option value="escalated">ESCALATED ONLY</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-900">
              <mat-icon class="scale-75">expand_more</mat-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Table Container -->
      <div class="relative group mt-8">
        <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-2 translate-y-2 transition-transform group-hover:translate-x-2.5 group-hover:translate-y-2.5"></div>
        <div class="relative bg-white border-2 border-gray-900 rounded-sm overflow-hidden flex flex-col transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
          <div class="overflow-x-auto w-full">
            <table mat-table [dataSource]="dataSource" class="w-full min-w-[800px]" [class.hidden]="dataSource.data.length === 0 || (dataSource.filteredData && dataSource.filteredData.length === 0)">
              
              <!-- Details Column -->
              <ng-container matColumnDef="details">
                <th mat-header-cell *matHeaderCellDef class="font-black text-gray-900 uppercase tracking-widest bg-gray-50 border-b-2 border-gray-900">Complaint Details</th>
                <td mat-cell *matCellDef="let complaint" class="py-4 border-b border-gray-200">
                  <div class="flex flex-col items-start gap-2">
                    <div class="font-black text-gray-900 uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">{{ complaint.title }}</div>
                    <span *ngIf="complaint.is_escalated" class="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest border-2 border-red-900 bg-red-100 text-red-900 shadow-[2px_2px_0px_0px_rgba(127,29,29,1)] animate-pulse whitespace-nowrap">
                      <mat-icon class="scale-[0.5] -ml-1 -mr-1">whatshot</mat-icon>
                      ESCALATED
                    </span>
                  </div>
                  <div class="mt-2 mb-2">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-widest border-2 border-gray-900 shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] bg-primary-100 text-primary-900">
                      <mat-icon class="scale-[0.6] -ml-1 mr-0.5">person</mat-icon>
                      {{ complaint.users?.full_name || 'Unknown Citizen' }}
                    </span>
                  </div>
                  <div class="text-xs font-bold text-gray-500 line-clamp-1 max-w-xs">{{ complaint.description }}</div>
                </td>
              </ng-container>

              <!-- Category & Location Column -->
              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef class="font-black text-gray-900 uppercase tracking-widest bg-gray-50 border-b-2 border-gray-900">Category & Location</th>
                <td mat-cell *matCellDef="let complaint" class="py-4 border-b border-gray-200">
                  <div class="text-[11px] font-black uppercase tracking-wider text-gray-900">{{ complaint.custom_category || complaint.complaint_categories?.name || 'Uncategorized' }}</div>
                  <div class="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center mt-1">
                    <mat-icon class="text-[12px] w-[12px] h-[12px] mr-1">location_on</mat-icon>
                    {{ complaint.barangay }}
                  </div>
                </td>
              </ng-container>

              <!-- Priority Column -->
              <ng-container matColumnDef="priority">
                <th mat-header-cell *matHeaderCellDef class="font-black text-gray-900 uppercase tracking-widest bg-gray-50 border-b-2 border-gray-900">Priority</th>
                <td mat-cell *matCellDef="let complaint" class="py-4 border-b border-gray-200">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-widest border-2 border-gray-900 shadow-[1px_1px_0px_0px_rgba(17,24,39,1)]"
                    [ngClass]="{
                      'bg-green-100 text-green-900': complaint.priority === 'low',
                      'bg-yellow-100 text-yellow-900': complaint.priority === 'medium',
                      'bg-orange-100 text-orange-900': complaint.priority === 'high',
                      'bg-red-100 text-red-900': complaint.priority === 'emergency'
                    }">
                    <mat-icon class="scale-[0.5] -ml-2 -mr-1 text-gray-900" *ngIf="complaint.priority === 'emergency'">warning</mat-icon>
                    {{ complaint.priority }}
                  </span>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef class="font-black text-gray-900 uppercase tracking-widest bg-gray-50 border-b-2 border-gray-900">Status</th>
                <td mat-cell *matCellDef="let complaint" class="py-4 whitespace-nowrap border-b border-gray-200">
                  <span class="inline-flex px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-widest border border-gray-900"
                    [ngClass]="{
                      'bg-yellow-200 text-yellow-900': complaint.status === 'pending',
                      'bg-blue-200 text-blue-900': complaint.status === 'assigned',
                      'bg-primary-200 text-primary-900': complaint.status === 'in_progress',
                      'bg-green-200 text-green-900': complaint.status === 'resolved',
                      'bg-gray-200 text-gray-900': complaint.status === 'closed',
                      'bg-red-200 text-red-900': complaint.status === 'rejected'
                    }">
                    {{ complaint.status.replace('_', ' ') }}
                  </span>
                </td>
              </ng-container>

              <!-- Action Column -->
              <ng-container matColumnDef="action">
                <th mat-header-cell *matHeaderCellDef class="font-black text-gray-900 uppercase tracking-widest text-right bg-gray-50 border-b-2 border-gray-900">Action</th>
                <td mat-cell *matCellDef="let complaint" class="py-4 whitespace-nowrap text-right border-b border-gray-200">
                  <div class="flex items-center justify-end gap-2">
                    <button mat-icon-button color="primary" (click)="openDetails(complaint)" matTooltip="View Full Details" class="border-2 border-gray-900 rounded-sm bg-primary-50 shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] scale-90">
                      <mat-icon>visibility</mat-icon>
                    </button>
                    
                    <ng-container *ngIf="complaint.status !== 'closed' && complaint.status !== 'rejected'">
                      <div class="relative inline-block w-36">
                        <select class="w-full appearance-none bg-white border-2 border-gray-900 rounded-sm pl-3 pr-8 py-1.5 text-xs font-black uppercase tracking-wider text-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] focus:outline-none focus:ring-0 focus:border-primary-600 cursor-pointer"
                                [value]="complaint.status" 
                                (change)="updateStatus(complaint, $any($event.target).value)">
                          <option value="pending">PENDING</option>
                          <option value="assigned">ASSIGNED</option>
                          <option value="in_progress">IN PROGRESS</option>
                          <option value="resolved">RESOLVED</option>
                          <option value="closed">CLOSED</option>
                          <option value="rejected">REJECTED</option>
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-900">
                          <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                      </div>
                    </ng-container>

                    <ng-container *ngIf="complaint.status === 'closed' || complaint.status === 'rejected'">
                      <div class="w-36 px-3 py-1.5 border-2 border-gray-900 rounded-sm text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-1 shadow-[1px_1px_0px_0px_rgba(17,24,39,1)]"
                           [ngClass]="complaint.status === 'rejected' ? 'bg-red-100 text-red-900' : 'bg-gray-100 text-gray-900'">
                        <mat-icon class="scale-75 -ml-1">lock</mat-icon>
                        {{ complaint.status }}
                      </div>
                    </ng-container>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                  class="hover:bg-primary-50 transition-colors cursor-default"
                  [ngClass]="{'bg-red-50/50 border-l-4 border-l-red-600': row.is_escalated}">
              </tr>
            </table>
            
            <!-- Empty State (No Data at All) -->
            <div *ngIf="dataSource.data.length === 0" 
                 class="flex flex-col items-center justify-center min-h-[320px] w-full text-center px-6 py-12">
              <div class="bg-primary-100 border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] p-4 rounded-full mb-6">
                <mat-icon class="h-10 w-10 text-primary-600 scale-[1.5]">inbox</mat-icon>
              </div>
              <h3 class="text-xl font-black text-gray-900 uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">No complaints found</h3>
              <p class="mt-2 text-sm font-bold text-gray-600 uppercase tracking-widest">Wait for citizens to report issues.</p>
            </div>

            <!-- Empty State (No Filter Results) -->
            <div *ngIf="dataSource.data.length > 0 && dataSource.filteredData && dataSource.filteredData.length === 0" 
                 class="flex flex-col items-center justify-center min-h-[320px] w-full text-center px-6 py-12">
              <div class="bg-primary-100 border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] p-4 rounded-full mb-6">
                <mat-icon class="h-10 w-10 text-primary-600 scale-[1.5]">search_off</mat-icon>
              </div>
              <h3 class="text-xl font-black text-gray-900 uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">No matching results</h3>
              <p class="mt-2 mb-6 text-sm font-bold text-gray-600 max-w-sm uppercase tracking-widest leading-relaxed">We couldn't find any complaints matching your search criteria.</p>
              <button mat-stroked-button (click)="clearFilter(searchInput)" class="!border-2 !border-gray-900 !rounded-sm font-black uppercase tracking-wider !text-gray-900">Clear Filters</button>
            </div>
          </div>
          
          <!-- Paginator (Hidden if no data) -->
          <mat-paginator 
            [class.hidden]="dataSource.data.length === 0 || (dataSource.filteredData && dataSource.filteredData.length === 0)"
            [pageSizeOptions]="[5, 10, 25, 100]" 
            aria-label="Select page of complaints" 
            class="shrink-0 border-t-2 border-gray-900 bg-gray-50">
          </mat-paginator>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mat-mdc-form-field { margin-bottom: 0 !important; }
    
    /* Clean up the search input styling */
    .search-field .mdc-text-field--outlined {
      --mdc-outlined-text-field-outline-width: 1px;
      --mdc-outlined-text-field-focus-outline-width: 2px;
      --mdc-outlined-text-field-focus-outline-color: #16a34a;
      background-color: transparent;
    }
    
    .search-field .mdc-notched-outline__leading,
    .search-field .mdc-notched-outline__notch,
    .search-field .mdc-notched-outline__trailing {
      border-color: #d1d5db !important;
    }

    /* Adjust Material Paginator to match retro theme */
    ::ng-deep .mat-mdc-paginator-container {
      padding: 8px 16px !important;
    }
  `]
})
export class AdminComplaintsComponent implements OnInit, OnDestroy {
  private complaintsService = inject(ComplaintsService);
  private supabaseService = inject(SupabaseService);
  private realtimeService = inject(RealtimeService);
  private dialog = inject(MatDialog);

  displayedColumns: string[] = ['details', 'category', 'priority', 'status', 'action'];
  dataSource = new MatTableDataSource<any>([]);
  private realtimeSub?: Subscription;
  
  isFiltering = false;
  showFilters = false;

  // Filter State
  filterValues = {
    global: '',
    barangay: '',
    category: '',
    priority: '',
    status: ''
  };

  barangays: string[] = [
    'Amunitan', 'Batangan', 'Baua', 'Cabiraoan', 'Callao', 'Caroan', 'Casitan', 
    'Claro M. Recto', 'Flourishing', 'Ipil', 'Iraya', 'Luga', 'Magrafil', 'Minanga', 
    'Paradise', 'Pateng', 'Progressive', 'San Jose', 'Santa Clara', 'Santa Cruz', 
    'Santa Maria', 'Smart', 'Tapel', 'Valle', 'Isca'
  ];
  availableCategories: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit() {
    // Setup Custom Filter Predicate
    this.dataSource.filterPredicate = this.createFilter();

    this.loadComplaints();
    
    // Subscribe to realtime updates
    this.realtimeService.subscribeToAllComplaints();
    this.realtimeSub = this.realtimeService.complaintsChanges$.subscribe(payload => {
      if (payload.eventType === 'UPDATE') {
        const data = this.dataSource.data;
        const index = data.findIndex(c => c.id === payload.new.id);
        if (index !== -1) {
          data[index] = { ...data[index], ...payload.new };
          this.dataSource.data = [...data]; // Trigger update
          this.extractCategories(this.dataSource.data);
        }
      } else {
        this.loadComplaints();
      }
    });
  }

  ngOnDestroy() {
    if (this.realtimeSub) {
      this.realtimeSub.unsubscribe();
    }
    this.realtimeService.unsubscribeFromAllComplaints();
  }

  loadComplaints() {
    this.complaintsService.getComplaints().subscribe(({ data, error }) => {
      if (!error && data) {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.extractCategories(data);
      }
    });
  }

  extractCategories(data: any[]) {
    const cats = data.map(c => c.complaint_categories?.name).filter(n => !!n);
    this.availableCategories = [...new Set(cats)].sort();
  }

  createFilter(): (data: any, filter: string) => boolean {
    return (data: any, filter: string): boolean => {
      let searchTerms;
      try {
        searchTerms = JSON.parse(filter);
      } catch (e) {
        return true;
      }

      const globalMatch = !searchTerms.global || 
        data.title?.toLowerCase().includes(searchTerms.global) ||
        data.description?.toLowerCase().includes(searchTerms.global) ||
        data.users?.full_name?.toLowerCase().includes(searchTerms.global) ||
        data.id?.toLowerCase().includes(searchTerms.global);

      const barangayMatch = !searchTerms.barangay || data.barangay === searchTerms.barangay;
      const categoryMatch = !searchTerms.category || data.complaint_categories?.name === searchTerms.category;
      const priorityMatch = !searchTerms.priority || data.priority === searchTerms.priority;
      
      let statusMatch = true;
      if (searchTerms.status === 'escalated') {
        statusMatch = data.is_escalated === true;
      } else if (searchTerms.status) {
        statusMatch = data.status === searchTerms.status;
      }

      return globalMatch && barangayMatch && categoryMatch && priorityMatch && statusMatch;
    };
  }

  applyFilter(event: Event) {
    this.filterValues.global = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.applyAllFilters();
  }
  
  applyAllFilters() {
    this.dataSource.filter = JSON.stringify(this.filterValues);
    
    // Check if any filter is actually applied for UI state
    this.isFiltering = !!this.filterValues.global || !!this.filterValues.barangay || 
                       !!this.filterValues.category || !!this.filterValues.priority || 
                       !!this.filterValues.status;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilter(inputElement: HTMLInputElement) {
    inputElement.value = '';
    this.filterValues = {
      global: '',
      barangay: '',
      category: '',
      priority: '',
      status: ''
    };
    this.applyAllFilters();
  }

  exportToCsv() {
    // Determine which data to export: filtered data or all data
    const dataToExport = this.dataSource.filteredData || this.dataSource.data;
    
    if (!dataToExport || dataToExport.length === 0) {
      alert('No data to export.');
      return;
    }

    // Define the headers
    const headers = [
      'Complaint ID',
      'Title',
      'Description',
      'Citizen Name',
      'Category',
      'Barangay',
      'Priority',
      'Status',
      'Date Reported'
    ];

    // Map the data rows
    const rows = dataToExport.map((complaint: any) => {
      return [
        `"${complaint.id}"`,
        `"${(complaint.title || '').replace(/"/g, '""')}"`,
        `"${(complaint.description || '').replace(/"/g, '""')}"`,
        `"${(complaint.users?.full_name || 'Unknown').replace(/"/g, '""')}"`,
        `"${(complaint.complaint_categories?.name || 'Uncategorized').replace(/"/g, '""')}"`,
        `"${(complaint.barangay || '').replace(/"/g, '""')}"`,
        `"${(complaint.priority || '').toUpperCase()}"`,
        `"${(complaint.status || '').toUpperCase().replace(/_/g, ' ')}"`,
        `"${new Date(complaint.created_at).toLocaleString()}"`
      ].join(',');
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Create Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Complaints_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async updateStatus(complaint: any, newStatus: string) {
    if (complaint.status === newStatus) return;

    const dialogRef = this.dialog.open(AdminStatusUpdateDialogComponent, {
      data: { complaint, newStatus },
      width: '450px',
      panelClass: 'modern-dialog',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result && result.proceed) {
        let uploadedPaths: string[] = complaint.resolution_images || [];

        if (result.resolutionFile) {
          const filePath = `resolution/${complaint.id}/${Date.now()}.jpeg`;
          const { error: uploadError } = await this.supabaseService.supabase.storage
            .from('complaint_images')
            .upload(filePath, result.resolutionFile);
            
          if (!uploadError) {
            const { data: publicUrlData } = this.supabaseService.supabase.storage
              .from('complaint_images')
              .getPublicUrl(filePath);
            
            uploadedPaths.push(publicUrlData.publicUrl);
          } else {
            console.error('Failed to upload resolution photo', uploadError);
          }
        }

        const { error } = await this.supabaseService.supabase
          .from('complaints')
          .update({ 
            status: newStatus, 
            resolution_notes: result.note,
            resolution_images: uploadedPaths
          })
          .eq('id', complaint.id);

        // Create an internal comment for the status update note if provided
        if (!error && result.note && result.note.trim() !== '') {
          const authRes = await this.supabaseService.supabase.auth.getUser();
          await this.supabaseService.supabase
            .from('complaint_comments')
            .insert({
              complaint_id: complaint.id,
              user_id: authRes.data.user?.id,
              body: `Status updated to ${newStatus.toUpperCase()}:\n\n${result.note}`,
              is_internal: true
            });
        }

        if (error) {
          console.error('Failed to update status', error);
          this.loadComplaints(); // Revert visually on error
        } else {
          complaint.status = newStatus;
          complaint.resolution_notes = result.note;
          complaint.resolution_images = uploadedPaths;
        }
      } else {
        // User cancelled, revert the dropdown visually
        this.dataSource.data = [...this.dataSource.data];
      }
    });
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
}
