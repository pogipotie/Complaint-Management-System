import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-citizen-announcements',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="space-y-6 pb-12">
      <!-- Header Section -->
      <div class="flex flex-col justify-center mb-8">
        <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight flex items-center gap-3">
          <mat-icon class="text-primary-600 scale-125">campaign</mat-icon>
          Municipality Announcements
        </h2>
        <p class="mt-2 text-sm text-gray-500">Stay updated with the latest alerts, news, and notices from the local government.</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loadingAnnouncements" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>

      <!-- Empty State -->
      <mat-card *ngIf="!loadingAnnouncements && announcements.length === 0" class="mat-elevation-z0 border border-gray-200 bg-white rounded-sm">
        <div class="flex flex-col items-center justify-center min-h-[400px] w-full text-center px-6 py-12">
          <div class="bg-primary-50 p-6 rounded-full mb-6 flex items-center justify-center">
            <mat-icon class="h-16 w-16 text-primary-300 flex items-center justify-center" style="font-size: 64px; height: 64px; width: 64px;">notifications_paused</mat-icon>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">No Active Announcements</h3>
          <p class="text-base text-gray-500 max-w-md w-full text-center">
            There are currently no active alerts, road closures, or emergencies reported by the municipality.
          </p>
        </div>
      </mat-card>

      <!-- Announcements Grid -->
      <div *ngIf="!loadingAnnouncements && announcements.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let ann of announcements" class="relative group">
          <!-- Retro offset shadow effect -->
          <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
          
          <!-- Main Card -->
          <div class="relative bg-white border-2 border-gray-900 rounded-sm overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5"
               [ngClass]="{
                  'bg-red-50': ann.type === 'Emergency',
                  'bg-orange-50': ann.type === 'Road Closure',
                  'bg-blue-50': ann.type === 'Water Interruption',
                  'bg-yellow-50': ann.type === 'Power Outage',
                  'bg-primary-50': ann.type === 'General Info'
               }">
            
            <!-- Window Header -->
            <div class="h-10 border-b-2 border-gray-900 flex items-center justify-between px-4 shrink-0"
                 [ngClass]="{
                    'bg-red-200': ann.type === 'Emergency',
                    'bg-orange-200': ann.type === 'Road Closure',
                    'bg-blue-200': ann.type === 'Water Interruption',
                    'bg-yellow-200': ann.type === 'Power Outage',
                    'bg-primary-200': ann.type === 'General Info'
                 }">
              <span class="font-bold text-[11px] tracking-wider text-gray-900 uppercase">
                {{ ann.created_at | date:'MMM dd, yyyy' }}
              </span>
              <div class="flex gap-1.5">
                <mat-icon class="scale-[0.6] text-gray-900" *ngIf="ann.type === 'Emergency'">warning</mat-icon>
                <mat-icon class="scale-[0.6] text-gray-900" *ngIf="ann.type === 'Road Closure'">traffic</mat-icon>
                <mat-icon class="scale-[0.6] text-gray-900" *ngIf="ann.type === 'Water Interruption'">water_drop</mat-icon>
                <mat-icon class="scale-[0.6] text-gray-900" *ngIf="ann.type === 'Power Outage'">bolt</mat-icon>
                <mat-icon class="scale-[0.6] text-gray-900" *ngIf="ann.type === 'General Info'">info</mat-icon>
              </div>
            </div>

            <!-- Content Body -->
            <div class="p-6 flex-1 flex flex-col">
              <h3 class="font-black text-xl text-gray-900 uppercase tracking-tight mb-2" style="font-family: 'Arial Black', Impact, sans-serif;">
                {{ ann.type }}
              </h3>
              
              <p class="font-bold text-xs text-gray-600 uppercase tracking-widest mb-4">
                {{ ann.created_at | date:'shortTime' }}
              </p>

              <p class="font-medium text-sm text-gray-800 leading-relaxed">
                {{ ann.body }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CitizenAnnouncementsComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  
  announcements: any[] = [];
  loadingAnnouncements = true;

  async ngOnInit() {
    this.loadingAnnouncements = true;
    const { data, error } = await this.supabaseService.supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      this.announcements = data;
    }
    this.loadingAnnouncements = false;
  }
}
