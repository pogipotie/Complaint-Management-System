import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { AdminComplaintsComponent } from './complaints/admin-complaints.component';
import { AdminAnnouncementsComponent } from './announcements/admin-announcements.component';
import { AdminUsersComponent } from './users/admin-users.component';
import { authGuard } from '../../core/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'complaints', component: AdminComplaintsComponent },
      { path: 'announcements', component: AdminAnnouncementsComponent },
      { path: 'users', component: AdminUsersComponent },
      { 
        path: 'chat', 
        loadComponent: () => import('../shared/official-chat/official-chat.component').then(m => m.OfficialChatComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
