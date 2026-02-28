import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, filter, take } from 'rxjs/operators';
import { selectIsAuthenticated, selectIsInitialized } from '../store/auth/auth.selectors';
import { combineLatest } from 'rxjs';

/**
 * Auth Guard - Protects routes that require authentication
 * 
 * Waits for auth initialization before checking authentication state.
 * Redirects to login if not authenticated.
 */
export const authGuard: CanActivateFn = (route, state) => {
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
      if (!isAuthenticated) {
        router.navigate(['/auth/login']);
        return false;
      }
      return true;
    })
  );
};
