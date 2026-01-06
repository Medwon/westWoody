import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { AppState } from '../store/app.state';
import { selectUserRoles } from '../store/auth/auth.selectors';
import { UserRole } from '../models/user.model';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const router = inject(Router);
  const store = inject(Store<AppState>);

  const requiredRoles = route.data['roles'] as UserRole[];

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  return store.select(selectUserRoles).pipe(
    take(1),
    map(userRoles => {
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

