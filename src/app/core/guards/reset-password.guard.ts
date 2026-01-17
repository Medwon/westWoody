import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Reset Password Guard - Ensures reset password page is only accessible with token query parameter
 */
export const resetPasswordGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const token = route.queryParams['token'];

  if (!token) {
    // Redirect to login if no token provided
    router.navigate(['/auth/login'], { queryParams: { error: 'missing_token' } });
    return false;
  }

  return true;
};
