import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import * as AuthActions from '../store/auth/auth.actions';

/**
 * Auth Interceptor - HttpOnly Cookie Based Authentication
 * 
 * - Adds withCredentials: true to all API requests
 * - Handles 401 globally by dispatching sessionExpired action
 * - NO manual token handling (cookies managed by browser)
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const store = inject(Store);

  // Only add credentials to requests to our API
  const isApiRequest = req.url.startsWith(environment.apiUrl);
  
  const authReq = isApiRequest
    ? req.clone({ withCredentials: true })
    : req;

  // Log for debugging (only in development)
  if (!environment.production && isApiRequest) {
    console.log('[AuthInterceptor] Adding withCredentials to API request:', req.url);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized - session expired or invalid
      if (error.status === 401 && isApiRequest) {
        // Skip session expired for auth endpoints (login, register, forgot-password, reset-password, activate)
        const isAuthEndpoint = req.url.includes('/auth/login') || 
                               req.url.includes('/auth/register') ||
                               req.url.includes('/auth/me') ||
                               req.url.includes('/auth/forgot-password') ||
                               req.url.includes('/auth/reset-password') ||
                               req.url.includes('/auth/activate');
        
        if (!isAuthEndpoint) {
          store.dispatch(AuthActions.sessionExpired());
        }
      }

      return throwError(() => error);
    })
  );
};
