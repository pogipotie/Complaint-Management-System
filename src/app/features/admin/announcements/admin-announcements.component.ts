import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-announcement-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="p-6 text-center">
      <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-100">
        <mat-icon class="text-red-500 scale-150">warning</mat-icon>
      </div>
      <h2 class="text-xl font-bold text-gray-900 mb-2">Delete Announcement</h2>
      <p class="text-gray-500 mb-6 text-sm leading-relaxed">
        Are you sure you want to delete this announcement? This action cannot be undone and will remove it from the citizen portal immediately.
      </p>
      <div class="flex justify-center gap-3">
        <button mat-stroked-button (click)="dialogRef.close(false)" class="!px-6">Cancel</button>
        <button mat-flat-button color="warn" (click)="dialogRef.close(true)" class="!px-6 shadow-sm">Delete</button>
      </div>
    </div>
  `
})
export class AnnouncementDeleteDialogComponent {
  public dialogRef = inject(MatDialogRef<AnnouncementDeleteDialogComponent>);
}

@Component({
  selector: 'app-admin-announcements',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule
  ],
  template: `
    <div class="space-y-6">
      
      <!-- Header -->
      <div class="flex justify-between items-end mb-8">
        <div>
          <h2 class="text-3xl font-black text-gray-900 flex items-center gap-3 uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">
            <mat-icon class="text-primary-600 scale-150 mr-1">campaign</mat-icon>
            Announcements
          </h2>
          <p class="text-gray-600 font-bold text-sm mt-2 uppercase tracking-widest">Create and manage alerts visible to all citizens.</p>
        </div>
      </div>

      <!-- Create Form -->
      <div class="relative group">
        <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
        <div class="relative bg-white border-2 border-gray-900 rounded-sm overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
          <div class="border-b-2 border-gray-900 bg-gray-50 p-4">
            <h3 class="text-lg font-black text-gray-900 uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">Post New Announcement</h3>
          </div>
          <div class="p-6">
            <form [formGroup]="announcementForm" (ngSubmit)="onSubmit()" class="space-y-4">
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <mat-form-field appearance="outline">
                  <mat-label>Announcement Type</mat-label>
                  <mat-select formControlName="type">
                    <mat-option value="Road Closure">Road Closure</mat-option>
                    <mat-option value="Water Interruption">Water Interruption</mat-option>
                    <mat-option value="Power Outage">Power Outage</mat-option>
                    <mat-option value="General Info">General Info</mat-option>
                    <mat-option value="Emergency">Emergency</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Message Content</mat-label>
                <textarea matInput formControlName="body" rows="3" placeholder="Describe the announcement..."></textarea>
              </mat-form-field>

              <div class="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4">
                <button mat-flat-button color="primary" type="submit" [disabled]="announcementForm.invalid || loading" class="w-full sm:w-auto !h-12 !px-8 !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider">
                  <mat-icon *ngIf="loading" class="animate-spin mr-2">autorenew</mat-icon>
                  {{ loading ? 'Posting...' : 'Post Announcement' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- History Table -->
      <div class="relative group mt-8">
        <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
        <div class="relative bg-white border-2 border-gray-900 rounded-sm overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
          <div class="border-b-2 border-gray-900 bg-gray-50 p-4">
            <h3 class="text-lg font-black text-gray-900 uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">Announcement History</h3>
          </div>
          
          <div class="overflow-x-auto w-full">
            <table mat-table [dataSource]="announcements" class="w-full min-w-[600px]">
              
              <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef class="font-black text-gray-900 uppercase tracking-widest bg-gray-50 border-b-2 border-gray-900">Type</th>
              <td mat-cell *matCellDef="let element" class="border-b border-gray-200">
                <span class="px-2 py-1 text-[10px] font-black uppercase rounded-sm whitespace-nowrap border-2 border-gray-900 shadow-[1px_1px_0px_0px_rgba(17,24,39,1)]"
                      [ngClass]="{
                        'bg-red-100 text-red-900': element.type === 'Emergency' || element.type === 'Road Closure',
                        'bg-blue-100 text-blue-900': element.type === 'Water Interruption',
                        'bg-yellow-100 text-yellow-900': element.type === 'Power Outage',
                        'bg-primary-100 text-primary-900': element.type === 'General Info'
                      }">
                  {{ element.type }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="body">
              <th mat-header-cell *matHeaderCellDef class="font-black text-gray-900 uppercase tracking-widest bg-gray-50 border-b-2 border-gray-900">Message</th>
              <td mat-cell *matCellDef="let element" class="max-w-[200px] sm:max-w-md truncate pr-4 text-gray-800 font-medium border-b border-gray-200">
                {{ element.body }}
              </td>
            </ng-container>

            <ng-container matColumnDef="created_at">
              <th mat-header-cell *matHeaderCellDef class="font-black text-gray-900 uppercase tracking-widest bg-gray-50 border-b-2 border-gray-900">Posted On</th>
              <td mat-cell *matCellDef="let element" class="text-gray-600 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap border-b border-gray-200">
                {{ element.created_at | date:'medium' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="w-16 bg-gray-50 border-b-2 border-gray-900"></th>
              <td mat-cell *matCellDef="let element" class="border-b border-gray-200">
                <button mat-icon-button color="warn" (click)="deleteAnnouncement(element.id)" class="border-2 border-gray-900 rounded-sm bg-red-50 shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] scale-90 hover:!bg-red-100">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:bg-primary-50 transition-colors"></tr>
            
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell text-center py-12 text-gray-500 font-bold uppercase tracking-widest text-xs" colspan="4">No announcements posted yet.</td>
            </tr>
          </table>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }
    .mat-mdc-form-field { width: 100%; }
    mat-card-header { padding: 16px 24px !important; }
  `]
})
export class AdminAnnouncementsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private supabaseService = inject(SupabaseService);
  private dialog = inject(MatDialog);

  announcements: any[] = [];
  displayedColumns = ['type', 'body', 'created_at', 'actions'];
  loading = false;

  announcementForm: FormGroup = this.fb.group({
    type: ['General Info', Validators.required],
    body: ['', [Validators.required, Validators.minLength(10)]]
  });

  ngOnInit() {
    this.loadAnnouncements();
  }

  async loadAnnouncements() {
    const { data, error } = await this.supabaseService.supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      this.announcements = data;
    }
  }

  async onSubmit() {
    if (this.announcementForm.invalid) return;
    this.loading = true;

    const { type, body } = this.announcementForm.value;
    
    const { error } = await this.supabaseService.supabase
      .from('announcements')
      .insert({ type, body });

    this.loading = false;
    
    if (!error) {
      this.announcementForm.reset({ type: 'General Info' });
      this.loadAnnouncements();
    } else {
      console.error('Failed to post announcement', error);
    }
  }

  deleteAnnouncement(id: string) {
    const dialogRef = this.dialog.open(AnnouncementDeleteDialogComponent, {
      width: '400px',
      panelClass: 'modern-dialog',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.supabaseService.supabase
          .from('announcements')
          .delete()
          .eq('id', id);
        this.loadAnnouncements();
      }
    });
  }
}