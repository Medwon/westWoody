import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { AppState } from '../store/app.state';
import * as AuthActions from '../store/auth/auth.actions';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const store = inject(Store<AppState>);
  
  const token = authService.getToken();

  // Clone request with auth header if token exists
  let authReq = req;
  if (token) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized - token expired or invalid
      if (error.status === 401) {
        authService.logout();
        store.dispatch(AuthActions.logoutSuccess());
        router.navigate(['/auth/login'], {
          queryParams: { sessionExpired: true }
        });
      }

      // Handle 403 Forbidden - not enough permissions
      if (error.status === 403) {
        router.navigate(['/home'], {
          queryParams: { accessDenied: true }
        });
      }

      return throwError(() => error);
    })
  );
};
