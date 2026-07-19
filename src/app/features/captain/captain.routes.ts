import { Routes } from '@angular/router';
import { CaptainLayoutComponent } from './captain-layout.component';
import { authGuard } from '../../core/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const CAPTAIN_ROUTES: Routes = [
  {
    path: '',
    component: CaptainLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['brgy_captain'] },
    children: [
      { 
        path: 'dashboard', 
        loadComponent: () => import('./dashboard/captain-dashboard.component').then(m => m.CaptainDashboardComponent)
      },
      { 
        path: 'complaints', 
        loadComponent: () => import('./complaints/captain-complaints.component').then(m => m.CaptainComplaintsComponent)
      },
      { 
        path: 'announcements', 
        loadComponent: () => import('./announcements/captain-announcements.component').then(m => m.CaptainAnnouncementsComponent)
      },
      { 
        path: 'users', 
        loadComponent: () => import('./users/captain-users.component').then(m => m.CaptainUsersComponent)
      },
      { 
        path: 'chat', 
        loadComponent: () => import('../shared/official-chat/official-chat.component').then(m => m.OfficialChatComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/captain-profile.component').then(m => m.CaptainProfileComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
