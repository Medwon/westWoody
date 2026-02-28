import { createReducer, on } from '@ngrx/store';
import { AuthState } from '../../models/user.model';
import * as AuthActions from './auth.actions';

/**
 * Initial auth state
 * - No tokens stored (HttpOnly cookies managed by browser)
 * - isInitialized tracks whether we've checked session on app start
 */
export const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null
};

export const authReducer = createReducer(
  initialState,

  // ============================================================
  // Init Auth (app startup)
  // ============================================================
  on(AuthActions.initAuth, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),

  on(AuthActions.initAuthSuccess, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    isLoading: false,
    isInitialized: true,
    error: null
  })),

  on(AuthActions.initAuthFailure, (state) => ({
    ...state,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: true,
    error: null
  })),

  // ============================================================
  // Login
  // ============================================================
  on(AuthActions.login, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),

  on(AuthActions.loginSuccess, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    isLoading: false,
    error: null
  })),

  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
    isAuthenticated: false,
    user: null
  })),

  // ============================================================
  // Register (auto-login)
  // ============================================================
  on(AuthActions.register, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),

  on(AuthActions.registerSuccess, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    isLoading: false,
    error: null
  })),

  on(AuthActions.registerFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),

  // ============================================================
  // Activate Account (auto-login)
  // ============================================================
  on(AuthActions.activateAccount, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),

  on(AuthActions.activateAccountSuccess, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    isLoading: false,
    error: null
  })),

  on(AuthActions.activateAccountFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),

  // ============================================================
  // Logout
  // ============================================================
  on(AuthActions.logout, (state) => ({
    ...state,
    isLoading: true
  })),

  on(AuthActions.logoutSuccess, (state) => ({
    ...initialState,
    isInitialized: true
  })),

  on(AuthActions.logoutFailure, (state) => ({
    ...initialState,
    isInitialized: true
  })),

  // ============================================================
  // Refresh Token Success (update state only, no navigation)
  // ============================================================
  on(AuthActions.refreshTokenSuccess, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    isLoading: false,
    error: null
  })),

  // ============================================================
  // Session Expired (401 from interceptor)
  // ============================================================
  on(AuthActions.sessionExpired, (state) => ({
    ...initialState,
    isInitialized: true
  })),

  // ============================================================
  // Clear Error
  // ============================================================
  on(AuthActions.clearError, (state) => ({
    ...state,
    error: null
  })),

  // ============================================================
  // Forgot Password
  // ============================================================
  on(AuthActions.forgotPassword, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),

  on(AuthActions.forgotPasswordSuccess, (state) => ({
    ...state,
    isLoading: false,
    error: null
  })),

  on(AuthActions.forgotPasswordFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),

  // ============================================================
  // Reset Password (auto-login)
  // ============================================================
  on(AuthActions.resetPassword, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),

  on(AuthActions.resetPasswordSuccess, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    isLoading: false,
    error: null
  })),

  on(AuthActions.resetPasswordFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),

  // ============================================================
  // Update User
  // ============================================================
  on(AuthActions.updateUser, (state, { user }) => ({
    ...state,
    user
  }))
);
