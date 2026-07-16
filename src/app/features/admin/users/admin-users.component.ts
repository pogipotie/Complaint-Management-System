import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminUserDetailDialogComponent } from './admin-user-detail-dialog.component';
import { AdminCreateCaptainDialogComponent } from './admin-create-captain-dialog.component';
import { MUNICIPALITY_CONFIG } from '../../../core/constants/municipality.config';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTabsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="p-6 max-w-7xl mx-auto pb-20">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-black text-gray-900 uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">User Management</h1>
          <p class="text-sm font-bold text-gray-600 uppercase tracking-wider">Manage Citizens and Barangay Captains</p>
        </div>
        <button mat-flat-button color="primary" (click)="loadUsers()" [disabled]="loading" class="!rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider">
          <mat-icon>refresh</mat-icon> Refresh
        </button>
      </div>

      <mat-tab-group (selectedTabChange)="onTabChange($event)" class="mb-6 custom-tabs">
        <mat-tab label="CITIZENS"></mat-tab>
        <mat-tab label="BARANGAY CAPTAINS"></mat-tab>
      </mat-tab-group>

      <div *ngIf="activeTab === 1" class="mb-6 flex justify-end">
        <button mat-flat-button color="accent" (click)="openCreateCaptainDialog()" class="!rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] font-black uppercase tracking-wider !bg-yellow-400 !text-gray-900">
          <mat-icon>add</mat-icon> Create Captain Account
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-4 mb-8 bg-gray-50 border-2 border-gray-900 p-4 rounded-sm shadow-[4px_4px_0px_0px_rgba(17,24,39,1)]">
        <mat-form-field appearance="outline" class="w-full sm:w-1/3 bg-white filter-field" *ngIf="activeTab === 0">
          <mat-label>Verification Status</mat-label>
          <mat-select [(ngModel)]="statusFilter" (selectionChange)="applyFilters()">
            <mat-option value="all">All Statuses</mat-option>
            <mat-option value="pending">Pending</mat-option>
            <mat-option value="verified">Verified</mat-option>
            <mat-option value="rejected">Rejected</mat-option>
            <mat-option value="banned">Banned</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full sm:w-1/3 bg-white filter-field">
          <mat-label>Barangay</mat-label>
          <mat-select [(ngModel)]="barangayFilter" (selectionChange)="applyFilters()">
            <mat-option value="all">All Barangays</mat-option>
            <mat-option *ngFor="let brgy of barangays" [value]="brgy">{{ brgy }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div *ngIf="loading" class="mb-4">
        <mat-progress-bar mode="indeterminate" color="primary"></mat-progress-bar>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <mat-card *ngFor="let user of paginatedUsers" class="!rounded-sm !border-2 !border-gray-900 !shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] flex flex-col h-full">
          <div class="border-b-2 border-gray-900 bg-gray-50 p-4 flex justify-between items-start">
            <div>
              <h2 class="text-lg font-black text-gray-900 uppercase tracking-tight m-0">{{ user.full_name }}</h2>
              <p class="text-xs font-bold text-gray-600 uppercase tracking-widest mt-1">{{ user.role }} • {{ user.barangay }}</p>
            </div>
            <span class="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm border-2 border-gray-900 shadow-[1px_1px_0px_0px_rgba(17,24,39,1)]"
                  [ngClass]="{
                    'bg-yellow-100 text-yellow-800': user.verification_status === 'pending',
                    'bg-green-100 text-green-800': user.verification_status === 'verified',
                    'bg-red-100 text-red-800': user.verification_status === 'rejected',
                    'bg-gray-800 text-white': user.verification_status === 'banned'
                  }">
              {{ user.verification_status || 'pending' }}
            </span>
          </div>

          <div class="p-4 flex-grow flex flex-col gap-4">
            <!-- Details (Citizen Only) -->
            <div *ngIf="user.role === 'citizen'" class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span class="text-xs font-bold text-gray-500 uppercase">Phone</span>
                <div class="font-medium text-gray-900">{{ user.phone || 'N/A' }}</div>
              </div>
              <div>
                <span class="text-xs font-bold text-gray-500 uppercase">Residency</span>
                <div class="font-medium text-gray-900">{{ user.residency_type || 'N/A' }}</div>
              </div>
              <div class="col-span-2">
                <span class="text-xs font-bold text-gray-500 uppercase">Address</span>
                <div class="font-medium text-gray-900">{{ user.street_address }}</div>
              </div>
            </div>

            <!-- Details (Captain Only) -->
            <div *ngIf="user.role === 'brgy_captain'" class="grid grid-cols-1 gap-2 text-sm text-center py-4">
               <div class="flex flex-col items-center justify-center">
                 <div class="h-16 w-16 bg-gray-200 border-2 border-gray-900 rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] mb-3 overflow-hidden">
                   <mat-icon class="text-gray-500 scale-150">person</mat-icon>
                 </div>
                 <span class="text-xs font-bold text-gray-500 uppercase">Account Type</span>
                 <div class="font-medium text-gray-900">Official Local Government Unit</div>
               </div>
            </div>

            <!-- ID Preview (Citizen Only) -->
            <div *ngIf="user.role === 'citizen'" class="mt-2 border-2 border-dashed border-gray-300 rounded-sm p-2 flex flex-col items-center justify-center bg-gray-50 min-h-[150px]">
              <span class="text-xs font-bold text-gray-500 uppercase mb-2">Proof of Residency (ID)</span>
              <img *ngIf="user.proof_of_residency_url" [src]="user.proof_of_residency_url" class="max-h-[150px] object-contain border border-gray-200 shadow-sm cursor-pointer" alt="ID Image" (click)="openImage(user.proof_of_residency_url)">
              <div *ngIf="!user.proof_of_residency_url" class="text-sm text-gray-400 font-medium italic">
                No ID Uploaded
              </div>
            </div>
          </div>

          <div class="border-t-2 border-gray-900 bg-gray-50 p-4 flex flex-col gap-3 mt-auto">
            <button *ngIf="user.role === 'citizen'" mat-stroked-button color="primary" class="w-full !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider" (click)="viewUserDetails(user)">
              <mat-icon>visibility</mat-icon> View Full Details
            </button>
            
            <div class="flex gap-3" *ngIf="user.verification_status !== 'verified' && user.verification_status !== 'banned'">
              <button mat-flat-button class="flex-1 !bg-green-500 hover:!bg-green-600 text-white !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider" (click)="updateStatus(user.id, 'verified')" [disabled]="processingId === user.id">
                <mat-icon>check</mat-icon> Verify
              </button>
              <button mat-flat-button color="warn" class="flex-1 !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider" (click)="viewUserDetails(user, 'reject')" [disabled]="processingId === user.id">
                <mat-icon>close</mat-icon> Reject
              </button>
            </div>

            <div class="flex gap-3" *ngIf="user.verification_status === 'verified'">
              <button mat-flat-button color="warn" class="w-full !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider" (click)="viewUserDetails(user, 'ban')" [disabled]="processingId === user.id">
                <mat-icon>block</mat-icon> Ban User
              </button>
            </div>

            <div class="flex gap-3" *ngIf="user.verification_status === 'banned'">
              <button mat-flat-button class="w-full !bg-gray-200 hover:!bg-gray-300 !text-gray-900 !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider" (click)="updateStatus(user.id, 'verified')" [disabled]="processingId === user.id">
                <mat-icon>restore</mat-icon> Lift Ban
              </button>
            </div>
          </div>
        </mat-card>

        <div *ngIf="!loading && filteredUsers.length === 0" class="col-span-full py-12 text-center border-2 border-dashed border-gray-300 rounded-sm bg-gray-50">
          <mat-icon class="text-gray-400 scale-150 mb-4">search_off</mat-icon>
          <h3 class="text-lg font-black text-gray-900 uppercase tracking-tight">No Users Found</h3>
          <p class="text-sm font-medium text-gray-500">There are no users matching your current filters.</p>
        </div>
      </div>

      <!-- Paginator -->
      <mat-paginator 
        *ngIf="filteredUsers.length > 0"
        [length]="filteredUsers.length"
        [pageSize]="pageSize"
        [pageSizeOptions]="[6, 12, 24, 48]"
        (page)="onPageChange($event)"
        class="border-t-2 border-gray-900 bg-gray-50 !rounded-sm !border-2 !border-gray-900 !shadow-[4px_4px_0px_0px_rgba(17,24,39,1)]">
      </mat-paginator>
    </div>
  `,
  styles: [`
    .filter-field .mdc-text-field--outlined {
      --mdc-outlined-text-field-focus-outline-width: 2px;
      --mdc-outlined-text-field-focus-outline-color: #16a34a;
    }
    
    /* Adjust Material Paginator to match retro theme */
    ::ng-deep .mat-mdc-paginator-container {
      padding: 8px 16px !important;
    }
    ::ng-deep .custom-tabs .mdc-tab-indicator__inner--theme-secondary {
      border-color: #111827 !important;
      border-width: 4px !important;
    }
    ::ng-deep .custom-tabs .mdc-tab__text-label {
      font-weight: 900 !important;
      letter-spacing: 0.05em !important;
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  users: any[] = [];
  filteredUsers: any[] = [];
  paginatedUsers: any[] = [];
  
  loading = true;
  processingId: string | null = null;

  barangays = MUNICIPALITY_CONFIG.barangays;
  statusFilter = 'all';
  barangayFilter = 'all';
  activeTab = 0; // 0 = Citizens, 1 = Captains

  // Pagination state
  pageSize = 6;
  currentPage = 0;

  ngOnInit() {
    this.loadUsers();
  }

  onTabChange(event: any) {
    this.activeTab = event.index;
    this.applyFilters();
  }

  openCreateCaptainDialog() {
    const dialogRef = this.dialog.open(AdminCreateCaptainDialogComponent, {
      width: '500px',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this.loading = true;
        try {
          await this.authService.createCaptainAccount({
            email: result.email,
            password: result.password,
            fullName: result.fullName,
            barangay: result.barangay
          });
          
          this.snackBar.open('Captain account successfully created!', 'Close', { duration: 3000 });
          this.loadUsers(); // Refresh the list
        } catch (err: any) {
          console.error(err);
          this.snackBar.open(err.message || 'Failed to create account', 'Close', { duration: 5000, panelClass: ['bg-red-600', 'text-white'] });
          this.loading = false;
        }
      }
    });
  }

  async loadUsers() {
    this.loading = true;
    
    // Fetch users (both citizen and brgy_captain)
    const { data, error } = await this.supabaseService.supabase
      .from('users')
      .select('*')
      .in('role', ['citizen', 'brgy_captain'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Sort so pending is at the top
      this.users = data.sort((a, b) => {
        if (a.verification_status === 'pending' && b.verification_status !== 'pending') return -1;
        if (a.verification_status !== 'pending' && b.verification_status === 'pending') return 1;
        return 0;
      });

      // Securely fetch short-lived Signed URLs for the ID images
      const pathsToSign = this.users
        .filter(u => u.proof_of_residency_url)
        .map(u => {
          // If it's a legacy public URL, extract just the path
          let path = u.proof_of_residency_url;
          if (path.includes('citizen_ids/')) {
            path = path.split('citizen_ids/')[1].split('?')[0];
          }
          return path;
        });

      const uniquePaths = [...new Set(pathsToSign)];

      if (uniquePaths.length > 0) {
        // Request signed URLs that expire in 10 minutes (600 seconds)
        // This is a highly secure window: long enough for the admin to review the page, 
        // but short enough that leaked links become useless very quickly.
        const { data: signedUrls } = await this.supabaseService.supabase.storage
          .from('citizen_ids')
          .createSignedUrls(uniquePaths, 600);

        if (signedUrls) {
          // Map the secure signed URLs back to the users array
          this.users.forEach(u => {
            if (u.proof_of_residency_url) {
              let path = u.proof_of_residency_url;
              if (path.includes('citizen_ids/')) {
                path = path.split('citizen_ids/')[1].split('?')[0];
              }
              const match = signedUrls.find(s => s.path === path);
              if (match?.signedUrl) {
                u.proof_of_residency_url = match.signedUrl;
              }
            }
          });
        }
      }

      this.applyFilters();

    } else {
      console.error('Error fetching users', error);
    }
    this.loading = false;
  }

  applyFilters() {
    this.filteredUsers = this.users.filter(user => {
      // Role Filter based on Tab
      const roleMatch = this.activeTab === 0 ? user.role === 'citizen' : user.role === 'brgy_captain';
      
      const matchStatus = this.statusFilter === 'all' || user.verification_status === this.statusFilter;
      const matchBarangay = this.barangayFilter === 'all' || user.barangay === this.barangayFilter;
      return roleMatch && matchStatus && matchBarangay;
    });
    
    // Reset to first page when filters change
    this.currentPage = 0;
    this.updatePaginatedUsers();
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedUsers();
  }

  updatePaginatedUsers() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  async updateStatus(userId: string, status: 'verified' | 'rejected' | 'banned', reason?: string) {
    this.processingId = userId;
    
    const updatePayload: any = { verification_status: status };
    if ((status === 'rejected' || status === 'banned') && reason) {
      updatePayload.rejection_reason = reason;
    }

    const { error } = await this.supabaseService.supabase
      .from('users')
      .update(updatePayload)
      .eq('id', userId);

    if (!error) {
      // Update local state
      const user = this.users.find(u => u.id === userId);
      if (user) {
        // If we are changing to banned or from banned to verified, notify the user
        if (status === 'banned' && user.verification_status !== 'banned') {
          await this.supabaseService.supabase.from('notifications').insert({
            user_id: userId,
            type: 'system',
            title: 'Account Banned',
            body: `Your account has been suspended. Reason: ${reason || 'Violation of community guidelines.'}`,
            should_email: true
          });
        } else if (status === 'verified' && user.verification_status === 'banned') {
          await this.supabaseService.supabase.from('notifications').insert({
            user_id: userId,
            type: 'system',
            title: 'Ban Lifted',
            body: 'Your account ban has been lifted. You may now submit complaints again.',
            should_email: true
          });
        }

        user.verification_status = status;
        if (reason) user.rejection_reason = reason;
        
        // Re-apply filters to move the card if the status filter is active
        this.applyFilters();
      }
    } else {
      console.error('Error updating verification status', error);
      alert('Failed to update verification status.');
    }
    
    this.processingId = null;
  }

  openImage(url: string) {
    if (url) {
      window.open(url, '_blank');
    }
  }

  viewUserDetails(user: any, startMode: 'none' | 'reject' | 'ban' = 'none') {
    const dialogRef = this.dialog.open(AdminUserDetailDialogComponent, {
      width: '95vw',
      maxWidth: '800px',
      data: { 
        user, 
        startInRejectMode: startMode === 'reject',
        startInBanMode: startMode === 'ban'
      },
      panelClass: 'custom-dialog-container',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && (result.action === 'verified' || result.action === 'rejected' || result.action === 'banned')) {
        this.updateStatus(user.id, result.action, result.reason);
      }
    });
  }
}