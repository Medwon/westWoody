import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, filter, take } from 'rxjs/operators';
import { selectIsAuthenticated, selectIsInitialized } from '../store/auth/auth.selectors';
import { combineLatest } from 'rxjs';

/**
 * Guest Guard - Protects auth routes (login, register) from authenticated users
 * 
 * Waits for auth initialization before checking authentication state.
 * Redirects to home if already authenticated.
 */
export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);
  const store = inject(Store);

  return combineLatest([
    store.select(selectIsInitialized),
    store.select(selectIsAuthenticated)
  ]).pipe(
    // Wait until auth is initialized
    filter(([initialized]) => initialized),
    take(1),
    map(([, isAuthenticated]) => {
      if (isAuthenticated) {
        router.navigate(['/home']);
        return false;
      }
      return true;
    })
  );
};
