import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Activation Guard - Ensures activation page is only accessible with token query parameter
 */
export const activationGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const token = route.queryParams['token'];

  if (!token) {
    // Redirect to login if no token provided
    router.navigate(['/auth/login'], { queryParams: { error: 'missing_token' } });
    return false;
  }

  return true;
};
