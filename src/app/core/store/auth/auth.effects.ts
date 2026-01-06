import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Login
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ credentials }) =>
        this.authService.login(credentials).pipe(
          map((response) => AuthActions.loginSuccess({ response })),
          catchError((error) =>
            of(AuthActions.loginFailure({
              error: error.error?.message || error.message || 'Ошибка входа'
            }))
          )
        )
      )
    )
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(() => {
          this.router.navigate(['/home']);
        })
      ),
    { dispatch: false }
  );

  // Register
  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      switchMap(({ data }) =>
        this.authService.register(data).pipe(
          map((response) => AuthActions.registerSuccess({ response })),
          catchError((error) =>
            of(AuthActions.registerFailure({
              error: error.error?.message || error.message || 'Ошибка регистрации'
            }))
          )
        )
      )
    )
  );

  registerSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.registerSuccess),
        tap(() => {
          // Redirect to login page with success message
          this.router.navigate(['/auth/login'], {
            queryParams: { registered: true }
          });
        })
      ),
    { dispatch: false }
  );

  // Activate Account
  activateAccount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.activateAccount),
      switchMap(({ data }) =>
        this.authService.activateAccount(data).pipe(
          map((response) => AuthActions.activateAccountSuccess({ response })),
          catchError((error) =>
            of(AuthActions.activateAccountFailure({
              error: error.error?.message || error.message || 'Ошибка активации'
            }))
          )
        )
      )
    )
  );

  activateAccountSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.activateAccountSuccess),
        tap(() => {
          this.router.navigate(['/auth/login'], {
            queryParams: { activated: true }
          });
        })
      ),
    { dispatch: false }
  );

  // Logout
  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => {
        this.authService.logout();
      }),
      map(() => AuthActions.logoutSuccess())
    )
  );

  logoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess),
        tap(() => {
          this.router.navigate(['/auth/login']);
        })
      ),
    { dispatch: false }
  );

  // Check Auth (on app initialization)
  checkAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.checkAuth),
      switchMap(() => {
        const token = this.authService.getToken();
        const user = this.authService.getStoredUser();

        if (!token || !user) {
          return of(AuthActions.checkAuthFailure());
        }

        // Check if token is expired
        if (this.authService.isTokenExpired(token)) {
          this.authService.logout();
          return of(AuthActions.checkAuthFailure());
        }

        return of(AuthActions.checkAuthSuccess({ user, token }));
      })
    )
  );
}
