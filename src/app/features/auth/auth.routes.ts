import { Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';

export const AUTH_ROUTES: Routes = [
  { path: 'login', redirectTo: '/?action=login', pathMatch: 'full' },
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: '/?action=login', pathMatch: 'full' }
];
