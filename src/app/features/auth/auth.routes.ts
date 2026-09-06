import { Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

export const AUTH_ROUTES: Routes = [
  { path: 'login', redirectTo: '/?action=login', pathMatch: 'full' },
  { path: 'register', component: RegisterComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: '', redirectTo: '/?action=login', pathMatch: 'full' }
];
