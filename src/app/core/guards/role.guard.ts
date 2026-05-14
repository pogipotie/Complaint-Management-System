import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';

export const roleGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles: string[] = route.data['roles'] || [];
  
  // Wait for user$ to emit the actual initialized user session
  const user = await firstValueFrom(authService.user$);

  if (!user) {
    return router.createUrlTree(['/auth/login']);
  }

  try {
    const profile = await authService.getUserProfile(user.id);
    if (profile && expectedRoles.includes(profile.role)) {
      return true;
    }
  } catch (error) {
    console.error('Error fetching profile role', error);
  }

  return router.createUrlTree(['/auth/login']);
};
