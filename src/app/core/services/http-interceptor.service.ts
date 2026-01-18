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

  // Check if request is to our API using multiple methods for robustness
  let isApiRequest = false;
  
  try {
    // Method 1: Check if URL starts with configured API URL
    if (req.url.startsWith(environment.apiUrl)) {
      isApiRequest = true;
    }
    
    // Method 2: Check if URL contains our API path pattern
    if (req.url.includes('/api/v1/')) {
      isApiRequest = true;
    }
    
    // Method 3: Check by domain (if URL is absolute)
    if (req.url.startsWith('http')) {
      const requestDomain = new URL(req.url).origin;
      const apiDomain = new URL(environment.apiUrl).origin;
      if (requestDomain === apiDomain) {
        isApiRequest = true;
      }
    }
  } catch (e) {
    // If URL parsing fails, check by string matching
    if (req.url.includes('herokuapp.com') || req.url.includes('westwood')) {
      isApiRequest = true;
    }
  }
  
  // ALWAYS add withCredentials for API requests (required for cross-domain cookies)
  const authReq = isApiRequest
    ? req.clone({ withCredentials: true })
    : req;

  // Log for debugging (always log in production to troubleshoot cookie issues)
  console.log('[AuthInterceptor]', {
    url: req.url,
    isApiRequest,
    withCredentials: authReq.withCredentials,
    apiUrl: environment.apiUrl,
    production: environment.production
  });

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
