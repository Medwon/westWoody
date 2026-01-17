import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError, tap, exhaustMap, delay } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  // ============================================================
  // Init Auth - Check session on app startup via /auth/me
  // ============================================================
  initAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.initAuth),
      exhaustMap(() =>
        this.authService.me().pipe(
          map((user) => AuthActions.initAuthSuccess({ user })),
          catchError(() => of(AuthActions.initAuthFailure()))
        )
      )
    )
  );

  // ============================================================
  // Login
  // ============================================================
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ credentials }) =>
        this.authService.login(credentials).pipe(
          map((user) => AuthActions.loginSuccess({ user })),
          catchError((error) =>
            of(AuthActions.loginFailure({
              error: error.error?.message || error.message || 'Неверный email или пароль'
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

  // ============================================================
  // Register (auto-login after registration)
  // ============================================================
  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      exhaustMap(({ data }) =>
        this.authService.register(data).pipe(
          map((user) => AuthActions.registerSuccess({ user })),
          catchError((error) =>
            of(AuthActions.registerFailure({
              error: error.error?.message || error.message || 'Ошибка регистрации'
            }))
          )
        )
      )
    )
  );

  // Register auto-logs in, redirect to home
  registerSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.registerSuccess),
        tap(() => {
          this.router.navigate(['/home']);
        })
      ),
    { dispatch: false }
  );

  // ============================================================
  // Activate Account (auto-login after activation)
  // ============================================================
  activateAccount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.activateAccount),
      exhaustMap(({ data }) =>
        this.authService.activate(data).pipe(
          map((user) => AuthActions.activateAccountSuccess({ user })),
          catchError((error) =>
            of(AuthActions.activateAccountFailure({
              error: error.error?.message || error.message || 'Ошибка активации'
            }))
          )
        )
      )
    )
  );

  // Activate auto-logs in, redirect to home
  activateAccountSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.activateAccountSuccess),
        tap(() => {
          this.toastService.success('Аккаунт успешно активирован!');
        }),
        delay(500), // Small delay to show toast before navigation
        tap(() => {
          this.router.navigate(['/home']);
        })
      ),
    { dispatch: false }
  );

  // ============================================================
  // Logout - Call server to clear HttpOnly cookie
  // ============================================================
  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      exhaustMap(() =>
        this.authService.logout().pipe(
          map(() => AuthActions.logoutSuccess()),
          catchError((error) =>
            of(AuthActions.logoutFailure({
              error: error.error?.message || 'Ошибка выхода'
            }))
          )
        )
      )
    )
  );

  logoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess, AuthActions.logoutFailure),
        tap(() => {
          this.router.navigate(['/auth/login']);
        })
      ),
    { dispatch: false }
  );

  // ============================================================
  // Session Expired - Redirect to login
  // ============================================================
  sessionExpired$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.sessionExpired),
        tap(() => {
          this.router.navigate(['/auth/login'], {
            queryParams: { sessionExpired: true }
          });
        })
      ),
    { dispatch: false }
  );
}
