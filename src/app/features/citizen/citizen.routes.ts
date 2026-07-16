import { Routes } from '@angular/router';
import { CitizenLayoutComponent } from './citizen-layout.component';
import { ComplaintListComponent } from './complaints/complaint-list.component';
import { ComplaintCreateComponent } from './complaints/complaint-create.component';
import { CommunityMapComponent } from './community/community-map.component';
import { TransparencyDashboardComponent } from './transparency-dashboard/transparency-dashboard.component';
import { ProfileSettingsComponent } from './profile-settings/profile-settings.component';
import { CitizenAnnouncementsComponent } from './announcements/citizen-announcements.component';
import { authGuard } from '../../core/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const CITIZEN_ROUTES: Routes = [
  {
    path: '',
    component: CitizenLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['citizen', 'admin'] }, // allow admin to view citizen side if needed
    children: [
      { path: 'complaints', component: ComplaintListComponent },
      { path: 'complaints/new', component: ComplaintCreateComponent },
      { path: 'community', component: CommunityMapComponent },
      { path: 'transparency', component: TransparencyDashboardComponent },
      { path: 'settings', component: ProfileSettingsComponent },
      { path: 'announcements', component: CitizenAnnouncementsComponent },
      { path: '', redirectTo: 'complaints', pathMatch: 'full' }
    ]
  }
];
