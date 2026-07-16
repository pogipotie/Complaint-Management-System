import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { NotificationsService, Notification } from '../../core/services/notifications.service';
import { LegalDialogComponent } from '../../shared/components/legal-dialog/legal-dialog.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-citizen-layout',
  standalone: true,
  imports: [
    RouterOutlet, 
    RouterModule, 
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule,
    MatDialogModule
  ],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <!-- App Header -->
      <mat-toolbar class="bg-white shadow-sm border-b border-gray-200 z-10 sticky top-0 px-4 sm:px-6 lg:px-8">
        <div class="max-w-7xl mx-auto w-full flex items-center justify-between h-full">
          
          <div class="flex items-center">
            <mat-icon color="primary" class="mr-2 hidden sm:block">domain</mat-icon>
            <span class="text-xl font-bold text-primary-600 tracking-tight mr-8">Municipality</span>
            
            <!-- Desktop Navigation -->
            <nav class="hidden md:flex space-x-1">
              <a mat-button routerLink="/citizen/community" routerLinkActive="bg-primary-50 text-primary-700" class="rounded-md px-3 font-black uppercase tracking-wider">
                <mat-icon class="mr-2">public</mat-icon>
                Community Map
              </a>
              <a mat-button routerLink="/citizen/transparency" routerLinkActive="bg-primary-50 text-primary-700" [routerLinkActiveOptions]="{exact: true}" class="rounded-md px-3 font-black uppercase tracking-wider">
                <mat-icon class="mr-2">insights</mat-icon>
                Transparency
              </a>
              <a mat-button routerLink="/citizen/announcements" routerLinkActive="bg-primary-50 text-primary-700" [routerLinkActiveOptions]="{exact: true}" class="rounded-md px-3 font-black uppercase tracking-wider">
                <mat-icon class="mr-2">campaign</mat-icon>
                Announcements
              </a>
              <a mat-button routerLink="/citizen/complaints" routerLinkActive="bg-primary-50 text-primary-700" [routerLinkActiveOptions]="{exact: true}" class="rounded-md px-3 font-black uppercase tracking-wider">
                <mat-icon class="mr-2">list_alt</mat-icon>
                My Complaints
              </a>
              <a mat-button routerLink="/citizen/complaints/new" routerLinkActive="bg-primary-50 text-primary-700" class="rounded-md px-3 font-black uppercase tracking-wider">
                <mat-icon class="mr-2">add_circle_outline</mat-icon>
                New Complaint
              </a>
            </nav>
          </div>

          <!-- User Actions -->
          <div class="flex items-center space-x-2">
            
            <!-- Notifications Menu -->
            <button mat-icon-button color="primary" [matMenuTriggerFor]="notificationMenu" class="sm:inline-flex">
              <mat-icon [matBadge]="(unreadCount$ | async)" [matBadgeHidden]="(unreadCount$ | async) === 0" matBadgeColor="warn">notifications</mat-icon>
            </button>
            
            <mat-menu #notificationMenu="matMenu" xPosition="before" class="notification-menu">
              <div class="px-4 py-3 border-b-2 border-gray-900 flex justify-between items-center bg-gray-50">
                <h3 class="text-sm font-black text-gray-900 uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">Notifications</h3>
                <div class="flex gap-1">
                  <button *ngIf="(unreadCount$ | async)! > 0" mat-button color="primary" class="!text-[10px] font-bold uppercase tracking-wider h-8 border border-gray-900 rounded-sm" (click)="markAllAsRead($event)">Mark all read</button>
                  <button *ngIf="(notifications$ | async)?.length! > 0" mat-icon-button color="warn" class="scale-75 border border-gray-900 rounded-sm" matTooltip="Clear All" (click)="clearAllNotifications($event)">
                    <mat-icon>delete_sweep</mat-icon>
                  </button>
                </div>
              </div>
              
              <div class="max-h-80 overflow-y-auto custom-scrollbar">
                <ng-container *ngIf="(notifications$ | async) as notifications">
                  <div *ngIf="notifications.length === 0" class="px-4 py-6 text-center text-gray-500 text-sm">
                    No notifications yet.
                  </div>
                  
                  <ng-container *ngFor="let note of notifications">
                    <button mat-menu-item class="notification-item flex items-start gap-4 whitespace-normal" [class.bg-primary-50]="!note.is_read" (click)="handleNotificationClick(note)">
                      <div class="flex-1 min-w-0 pr-2 mt-1">
                        <p class="text-sm font-black text-gray-900 leading-tight mb-2 truncate uppercase" [class.text-primary-900]="!note.is_read" style="font-family: 'Arial Black', Impact, sans-serif;">{{ note.title }}</p>
                        
                        <div class="text-[11px] font-bold text-gray-600 leading-relaxed line-clamp-2 mb-2 flex flex-wrap items-center gap-x-1 uppercase tracking-wider">
                          <ng-container *ngIf="extractStatus(note.body) as extracted">
                            <span *ngIf="!extracted.status">{{ note.body }}</span>
                            <ng-container *ngIf="extracted.status">
                              <span>{{ extracted.prefix }}</span>
                              <span class="inline-flex items-center px-1.5 py-0.5 rounded-sm border border-gray-900 text-[9px] font-black" [ngClass]="getStatusColor(extracted.status)">
                                {{ extracted.status }}
                              </span>
                            </ng-container>
                          </ng-container>
                        </div>

                        <div *ngIf="note.complaint" class="mt-2 mb-3 p-3 bg-white border-2 border-gray-900 rounded-sm shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                          <div class="flex justify-between items-start mb-2">
                            <div>
                              <p class="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-0.5">Reference ID</p>
                              <p class="text-[10px] font-bold uppercase tracking-wider text-gray-900 font-mono">{{ note.complaint.id | slice:0:8 }}</p>
                            </div>
                            <span class="px-1.5 py-0.5 rounded-sm border-2 border-gray-900 text-[9px] font-black uppercase tracking-widest shadow-[1px_1px_0px_0px_rgba(17,24,39,1)]"
                                  [ngClass]="getStatusColor(note.complaint.status)">
                              {{ note.complaint.status }}
                            </span>
                          </div>
                          
                          <p class="text-[11px] font-black text-gray-900 uppercase tracking-tight leading-tight mb-2 truncate" style="font-family: 'Arial Black', Impact, sans-serif;">{{ note.complaint.title }}</p>
                          
                          <div class="flex flex-col gap-1.5 text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                            <div class="flex items-center">
                              <mat-icon style="font-size: 12px; width: 12px; height: 12px; line-height: 12px;" class="mr-1.5 text-gray-400">category</mat-icon>
                              <span class="truncate">{{ note.complaint.category?.name || 'General' }}</span>
                            </div>
                            <div class="flex items-center">
                              <mat-icon style="font-size: 12px; width: 12px; height: 12px; line-height: 12px;" class="mr-1.5 text-gray-400">place</mat-icon>
                              <span class="truncate">{{ note.complaint.barangay || note.complaint.location_text || 'Location' }}</span>
                            </div>
                            <div class="flex items-center mt-0.5 text-gray-500">
                              <mat-icon style="font-size: 12px; width: 12px; height: 12px; line-height: 12px;" class="mr-1.5">event</mat-icon>
                              <span>Reported: {{ note.complaint.created_at | date:'MMM d, yyyy' }}</span>
                            </div>
                          </div>
                        </div>

                        <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center">
                          <mat-icon style="font-size: 12px; width: 12px; height: 12px; line-height: 12px;" class="mr-1">schedule</mat-icon>
                          {{ note.created_at | date:'short' }}
                        </p>
                      </div>
                      <div *ngIf="!note.is_read" class="h-3 w-3 border-2 border-gray-900 rounded-sm bg-primary-500 mt-2 shrink-0 shadow-[1px_1px_0px_0px_rgba(17,24,39,1)]"></div>
                    </button>
                  </ng-container>
                </ng-container>
              </div>
            </mat-menu>

            <!-- Profile Menu -->
            <button mat-icon-button [matMenuTriggerFor]="profileMenu" class="ml-2">
              <div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center border border-primary-200">
                <mat-icon color="primary" class="scale-75">person</mat-icon>
              </div>
            </button>
            <mat-menu #profileMenu="matMenu" xPosition="before" class="profile-menu">
              <div class="px-4 py-3 border-b-2 border-gray-900 bg-primary-50">
                <p class="text-sm font-black text-gray-900 truncate uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">{{ userEmail }}</p>
                <p class="text-[10px] font-bold text-primary-600 truncate uppercase tracking-widest mt-0.5">Citizen Profile</p>
              </div>
              <a mat-menu-item routerLink="/citizen/community" class="md:hidden !border-b-2 !border-gray-900">
                <mat-icon class="text-gray-900">public</mat-icon>
                <span class="font-bold uppercase tracking-wider text-[11px] text-gray-900">Community Map</span>
              </a>
              <a mat-menu-item routerLink="/citizen/transparency" class="md:hidden !border-b-2 !border-gray-900">
                <mat-icon class="text-gray-900">insights</mat-icon>
                <span class="font-bold uppercase tracking-wider text-[11px] text-gray-900">Transparency</span>
              </a>
              <a mat-menu-item routerLink="/citizen/announcements" class="md:hidden !border-b-2 !border-gray-900">
                <mat-icon class="text-gray-900">campaign</mat-icon>
                <span class="font-bold uppercase tracking-wider text-[11px] text-gray-900">Announcements</span>
              </a>
              <a mat-menu-item routerLink="/citizen/complaints" class="md:hidden !border-b-2 !border-gray-900">
                <mat-icon class="text-gray-900">list_alt</mat-icon>
                <span class="font-bold uppercase tracking-wider text-[11px] text-gray-900">My Complaints</span>
              </a>
              <a mat-menu-item routerLink="/citizen/complaints/new" class="md:hidden !border-b-2 !border-gray-900 bg-primary-50">
                <mat-icon class="text-primary-600">add_circle_outline</mat-icon>
                <span class="font-bold uppercase tracking-wider text-[11px] text-primary-600">New Complaint</span>
              </a>
              <a mat-menu-item routerLink="/citizen/settings" class="!border-b-2 !border-gray-900">
                <mat-icon class="text-gray-900">manage_accounts</mat-icon>
                <span class="font-bold uppercase tracking-wider text-[11px] text-gray-900">Profile Settings</span>
              </a>
              <button mat-menu-item (click)="logout()" class="bg-red-50 hover:!bg-red-100 transition-colors">
                <mat-icon color="warn">logout</mat-icon>
                <span class="text-red-600 font-black uppercase tracking-wider text-[11px]">Sign out</span>
              </button>
            </mat-menu>
          </div>

        </div>
      </mat-toolbar>

      <!-- Main Content Area -->
      <main class="flex-1 w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <router-outlet></router-outlet>
      </main>
      
      <!-- Footer -->
      <footer class="bg-white border-t border-gray-200 py-6 mt-auto">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
          <p class="text-sm text-gray-500">© 2026 Municipality Portal. All rights reserved.</p>
          <div class="flex space-x-4 mt-4 sm:mt-0">
            <button (click)="openLegal('privacy')" class="text-gray-400 hover:text-gray-500 bg-transparent border-none p-0 cursor-pointer">Privacy Policy</button>
            <button (click)="openLegal('terms')" class="text-gray-400 hover:text-gray-500 bg-transparent border-none p-0 cursor-pointer">Terms of Service</button>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .mat-mdc-button.bg-primary-50 {
      background-color: #f0fdf4 !important; /* primary-50 */
      color: #16a34a !important; /* primary-600 */
    }
    
    ::ng-deep .profile-menu {
      min-width: 240px !important;
      padding: 0 !important;
      border-radius: 4px !important;
      border: 2px solid #111827 !important;
      box-shadow: 4px 4px 0px 0px rgba(17, 24, 39, 1) !important;
      margin-top: 8px !important;
    }
    ::ng-deep .notification-menu {
      max-width: 400px !important;
      width: 100vw;
      padding: 0 !important;
      border-radius: 4px !important;
      border: 2px solid #111827 !important;
      box-shadow: 4px 4px 0px 0px rgba(17, 24, 39, 1) !important;
    }
    
    .notification-item {
      line-height: normal !important;
      height: auto !important;
      min-height: 80px;
      padding: 16px !important;
      transition: background-color 0.2s ease;
      border-bottom: 2px solid #111827 !important;
    }

    .notification-item:hover {
      background-color: #f8fafc !important;
    }

    /* Reset Angular Material's internal button hover state to avoid double-hover effects */
    .notification-item::before {
      display: none !important;
    }
    
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: #cbd5e1;
      border-radius: 4px;
    }

    mat-icon {
      font-family: 'Material Icons' !important;
    }
  `]
})
export class CitizenLayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private notificationsService = inject(NotificationsService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  
  userEmail: string = 'User';
  userId: string | null = null;

  notifications$: Observable<Notification[]> = this.notificationsService.notifications$;
  unreadCount$: Observable<number> = this.notificationsService.unreadCount$;

  ngOnInit() {
    if (this.authService.user) {
      this.userEmail = this.authService.user.email || 'Citizen';
      this.userId = this.authService.user.id;
      
      // Load initial notifications and subscribe to realtime updates
      this.notificationsService.loadNotifications(this.userId);
      this.notificationsService.subscribeToNotifications(this.userId);
    }
  }

  extractStatus(body: string): { prefix: string, status: string | null } {
    const match = body.match(/(.* updated to )([^.]+)\.?$/);
    if (match) {
      return {
        prefix: match[1],
        status: match[2]
      };
    }
    return { prefix: body, status: null };
  }

  getStatusColor(status: string): string {
    switch (status.toUpperCase()) {
      case 'PENDING': return 'bg-yellow-200 text-yellow-900';
      case 'IN PROGRESS': return 'bg-primary-200 text-primary-900';
      case 'RESOLVED': return 'bg-green-200 text-green-900';
      case 'REJECTED': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-200 text-gray-900';
    }
  }

  ngOnDestroy() {
    this.notificationsService.unsubscribe();
  }

  handleNotificationClick(note: Notification) {
    if (!note.is_read) {
      this.notificationsService.markAsRead(note.id);
    }
    // Navigate to the specific complaint details
    this.router.navigate(['/citizen/complaints']);
    // You can optionally add logic to automatically open the specific complaint dialog here 
    // by passing state through the router or a shared service.
  }

  markAllAsRead(event: Event) {
    event.stopPropagation(); // Keep menu open
    if (this.userId) {
      this.notificationsService.markAllAsRead(this.userId);
    }
  }

  clearAllNotifications(event: Event) {
    event.stopPropagation(); // Keep menu open
    if (this.userId) {
      this.notificationsService.clearAllNotifications(this.userId);
    }
  }

  logout() {
    this.authService.signOut().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      }
    });
  }

  openLegal(type: 'privacy' | 'terms') {
    this.dialog.open(LegalDialogComponent, {
      width: '95vw',
      maxWidth: '700px',
      panelClass: 'modern-dialog',
      autoFocus: false,
      data: { type }
    });
  }
}
