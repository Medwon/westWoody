import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import * as AuthActions from '../store/auth/auth.actions';

/**
 * Auth Interceptor - HttpOnly Cookie Based Authentication
 * 
 * - Adds withCredentials: true to all API requests
 * - Automatically refreshes access token on 401 errors
 * - Handles session expiration by dispatching sessionExpired action
 * - NO manual token handling (cookies managed by browser)
 */

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const store = inject(Store);
  const authService = inject(AuthService);

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

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized - try to refresh token first
      if (error.status === 401 && isApiRequest) {
        // Skip refresh for auth endpoints (login, register, forgot-password, reset-password, activate, refresh)
        const isAuthEndpoint = req.url.includes('/auth/login') || 
                               req.url.includes('/auth/register') ||
                               req.url.includes('/auth/me') ||
                               req.url.includes('/auth/forgot-password') ||
                               req.url.includes('/auth/reset-password') ||
                               req.url.includes('/auth/activate') ||
                               req.url.includes('/auth/refresh');
        
        // Try to refresh token if not already refreshing and not an auth endpoint
        if (!isAuthEndpoint && !isRefreshing) {
          isRefreshing = true;
          
          console.log('[AuthInterceptor] Access token expired, attempting refresh...');
          
          // Try to refresh the token
          return authService.refresh().pipe(
            switchMap((user) => {
              isRefreshing = false;
              console.log('[AuthInterceptor] Token refreshed successfully, retrying request');
              // Update auth state with refreshed user
              store.dispatch(AuthActions.loginSuccess({ user }));
              // Retry the original request (cookies are automatically updated)
              return next(authReq);
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              console.log('[AuthInterceptor] Token refresh failed, session expired');
              // Refresh failed - session truly expired
              store.dispatch(AuthActions.sessionExpired());
              return throwError(() => refreshError);
            })
          );
        }
        
        // If already refreshing or is an auth endpoint, dispatch session expired
        if (!isAuthEndpoint) {
          store.dispatch(AuthActions.sessionExpired());
        }
      }

      return throwError(() => error);
    })
  );
};
