import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { RouterOutlet, RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../core/services/auth.service';
import { NotificationsService, Notification } from '../../core/services/notifications.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, Observable } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet, 
    RouterModule, 
    CommonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule
  ],
  template: `
    <mat-sidenav-container class="h-screen w-full bg-gray-50">
      
      <!-- Sidebar -->
      <mat-sidenav #sidenav [mode]="isMobile ? 'over' : 'side'" [opened]="!isMobile" class="w-64 border-r-2 border-gray-900 bg-white shadow-[4px_0_0_0_rgba(17,24,39,1)]">
        <mat-toolbar class="bg-primary-50 border-b-2 border-gray-900 flex items-center px-4">
          <mat-icon color="primary" class="mr-2">domain</mat-icon>
          <span class="text-xl font-black text-gray-900 uppercase tracking-tight truncate" style="font-family: 'Arial Black', Impact, sans-serif;">
            Municipality
          </span>
        </mat-toolbar>

        <mat-nav-list class="pt-4 px-2">
          <div mat-subheader class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-4">Management</div>
          
          <a mat-list-item routerLink="/admin/dashboard" routerLinkActive="bg-primary-100 text-primary-900 border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]" class="hover:bg-gray-50 transition-all rounded-sm mb-2">
            <mat-icon matListItemIcon [color]="router.url.includes('/dashboard') ? 'primary' : ''" class="text-gray-900">dashboard</mat-icon>
            <span matListItemTitle class="font-bold uppercase tracking-wider text-[11px]">Dashboard</span>
          </a>

          <a *ngIf="userRole === 'admin'" mat-list-item routerLink="/admin/users" routerLinkActive="bg-primary-100 text-primary-900 border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]" class="hover:bg-gray-50 transition-all rounded-sm mb-2">
            <mat-icon matListItemIcon [color]="router.url.includes('/users') ? 'primary' : ''" class="text-gray-900">people</mat-icon>
            <span matListItemTitle class="font-bold uppercase tracking-wider text-[11px]">User Approvals</span>
          </a>

          <a mat-list-item routerLink="/admin/complaints" routerLinkActive="bg-primary-100 text-primary-900 border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]" class="hover:bg-gray-50 transition-all rounded-sm mb-2">
            <mat-icon matListItemIcon [color]="router.url.includes('/complaints') ? 'primary' : ''" class="text-gray-900">list_alt</mat-icon>
            <span matListItemTitle class="font-bold uppercase tracking-wider text-[11px]">Complaints List</span>
          </a>

          <a *ngIf="userRole === 'admin'" mat-list-item routerLink="/admin/announcements" routerLinkActive="bg-primary-100 text-primary-900 border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]" class="hover:bg-gray-50 transition-all rounded-sm mb-2">
            <mat-icon matListItemIcon [color]="router.url.includes('/announcements') ? 'primary' : ''" class="text-gray-900">campaign</mat-icon>
            <span matListItemTitle class="font-bold uppercase tracking-wider text-[11px]">Announcements</span>
          </a>

          <a *ngIf="userRole === 'admin'" mat-list-item routerLink="/admin/chat" routerLinkActive="bg-primary-100 text-primary-900 border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]" class="hover:bg-gray-50 transition-all rounded-sm mb-2">
            <mat-icon matListItemIcon [color]="router.url.includes('/chat') ? 'primary' : ''" class="text-gray-900">forum</mat-icon>
            <span matListItemTitle class="font-bold uppercase tracking-wider text-[11px]">Official Chat</span>
          </a>
        </mat-nav-list>

        <!-- Bottom Actions -->
        <div class="absolute bottom-0 w-full p-4 border-t-2 border-gray-900 bg-gray-50">
          <button mat-flat-button color="warn" class="w-full !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider" (click)="logout()">
            <mat-icon>logout</mat-icon>
            Sign out
          </button>
        </div>
      </mat-sidenav>

      <!-- Main Content -->
      <mat-sidenav-content class="flex flex-col min-w-0">
        <!-- Top Toolbar -->
        <mat-toolbar class="bg-white shadow-[0_4px_0_0_rgba(17,24,39,1)] border-b-2 border-gray-900 z-10 px-4 md:px-6 sticky top-0">
          <button mat-icon-button (click)="sidenav.toggle()" class="md:hidden mr-2">
            <mat-icon>menu</mat-icon>
          </button>

          <span class="text-lg md:text-xl font-black text-gray-900 uppercase tracking-tight truncate" style="font-family: 'Arial Black', Impact, sans-serif;">{{ getPageTitle() }}</span>
          
          <span class="flex-auto"></span>

          <div class="flex items-center space-x-1 md:space-x-2">
            
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
            
            <button mat-icon-button [matMenuTriggerFor]="userMenu">
              <div class="h-8 w-8 rounded-sm border-2 border-gray-900 bg-primary-600 flex items-center justify-center text-white font-black shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] text-sm">
                A
              </div>
            </button>
            <mat-menu #userMenu="matMenu" class="retro-menu">
              <button mat-menu-item disabled class="!border-b-2 !border-gray-900">
                <mat-icon class="text-gray-900">account_circle</mat-icon>
                <span class="font-bold uppercase tracking-wider text-[11px] text-gray-900">Admin Profile</span>
              </button>
              <button mat-menu-item (click)="logout()" class="bg-red-50 hover:!bg-red-100 transition-colors">
                <mat-icon color="warn">logout</mat-icon>
                <span class="text-red-600 font-black uppercase tracking-wider text-[11px]">Sign out</span>
              </button>
            </mat-menu>
          </div>
        </mat-toolbar>

        <!-- Scrollable Main Area -->
        <div class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
          <!-- Background decoration -->
          <div class="absolute inset-0 bg-gray-50 -z-10"></div>
          
          <div class="max-w-7xl mx-auto w-full relative z-0">
            <router-outlet></router-outlet>
          </div>
        </div>
      </mat-sidenav-content>
      
    </mat-sidenav-container>
  `,
  styles: [`
    .mat-mdc-list-item-icon { margin-right: 16px !important; }
    
    ::ng-deep .retro-menu {
      min-width: 200px !important;
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
      margin-top: 8px !important;
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
  `]
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private notificationsService = inject(NotificationsService);
  public router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);

  @ViewChild('sidenav') sidenav!: MatSidenav;
  
  isMobile = false;
  userRole: string | null = null;
  private destroy$ = new Subject<void>();
  
  userEmail: string = 'Admin';
  userId: string | null = null;

  notifications$: Observable<Notification[]> = this.notificationsService.notifications$;
  unreadCount$: Observable<number> = this.notificationsService.unreadCount$;

  ngOnInit() {
    if (this.authService.user) {
      this.userEmail = this.authService.user.email || 'Admin';
      this.userId = this.authService.user.id;
      
      this.notificationsService.loadNotifications(this.userId);
      this.notificationsService.subscribeToNotifications(this.userId);

      this.authService.getUserProfile(this.userId).then(profile => {
        if (profile) {
          this.userRole = profile.role;
        }
      });
    }
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.matches;
        if (!this.isMobile && this.sidenav) {
          this.sidenav.open();
        } else if (this.isMobile && this.sidenav) {
          this.sidenav.close();
        }
      });

    // Close sidenav on mobile after navigation
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.isMobile && this.sidenav) {
          this.sidenav.close();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.notificationsService.unsubscribe();
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

  handleNotificationClick(note: Notification) {
    if (!note.is_read) {
      this.notificationsService.markAsRead(note.id);
    }
    
    // Navigate based on notification type/content
    if (note.title.includes('Registration Resubmitted') || note.type === 'system') {
      this.router.navigate(['/admin/users']);
    } else {
      this.router.navigate(['/admin/complaints']);
    }
  }

  markAllAsRead(event: Event) {
    event.stopPropagation();
    if (this.userId) {
      this.notificationsService.markAllAsRead(this.userId);
    }
  }

  clearAllNotifications(event: Event) {
    event.stopPropagation();
    if (this.userId) {
      this.notificationsService.clearAllNotifications(this.userId);
    }
  }

  getPageTitle(): string {
    const url = this.router.url;
    if (url.includes('/dashboard')) return 'Admin Dashboard';
    if (url.includes('/complaints')) return 'Complaints Management';
    if (url.includes('/announcements')) return 'Announcements';
    if (url.includes('/users')) return 'User Approvals';
    return 'Admin Portal';
  }

  logout() {
    this.authService.signOut().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
