import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, filter, take } from 'rxjs/operators';
import { selectUserRoles, selectIsInitialized } from '../store/auth/auth.selectors';
import { UserRole } from '../models/user.model';
import { combineLatest } from 'rxjs';

/**
 * Role Guard - Protects routes that require specific roles
 * 
 * Usage in routes:
 * { path: 'admin', canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'] } }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const store = inject(Store);

  const requiredRoles = route.data['roles'] as UserRole[];

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  return combineLatest([
    store.select(selectIsInitialized),
    store.select(selectUserRoles)
  ]).pipe(
    filter(([initialized]) => initialized),
    take(1),
    map(([, userRoles]) => {
      const hasRole = requiredRoles.some(role => userRoles.includes(role));
      
      if (!hasRole) {
        router.navigate(['/home'], {
          queryParams: { accessDenied: true }
        });
        return false;
      }
      
      return true;
    })
  );
};

