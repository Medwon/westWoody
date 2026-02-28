import { createAction, props } from '@ngrx/store';
import {
  AuthUser,
  LoginRequest,
  RegisterRequest,
  ActivateAccountRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest
} from '../../models/user.model';

// ============================================================
// App Initialization - Check if user has valid session cookie
// ============================================================
export const initAuth = createAction('[Auth] Init Auth');

export const initAuthSuccess = createAction(
  '[Auth] Init Auth Success',
  props<{ user: AuthUser }>()
);

export const initAuthFailure = createAction('[Auth] Init Auth Failure');

// ============================================================
// Login
// ============================================================
export const login = createAction(
  '[Auth] Login',
  props<{ credentials: LoginRequest }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: AuthUser }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

// ============================================================
// Register (auto-login after registration)
// ============================================================
export const register = createAction(
  '[Auth] Register',
  props<{ data: RegisterRequest }>()
);

export const registerSuccess = createAction(
  '[Auth] Register Success',
  props<{ user: AuthUser }>()
);

export const registerFailure = createAction(
  '[Auth] Register Failure',
  props<{ error: string }>()
);

// ============================================================
// Activate Account (auto-login after activation)
// ============================================================
export const activateAccount = createAction(
  '[Auth] Activate Account',
  props<{ data: ActivateAccountRequest }>()
);

export const activateAccountSuccess = createAction(
  '[Auth] Activate Account Success',
  props<{ user: AuthUser }>()
);

export const activateAccountFailure = createAction(
  '[Auth] Activate Account Failure',
  props<{ error: string }>()
);

// ============================================================
// Logout
// ============================================================
export const logout = createAction('[Auth] Logout');

export const logoutSuccess = createAction('[Auth] Logout Success');

export const logoutFailure = createAction(
  '[Auth] Logout Failure',
  props<{ error: string }>()
);

// ============================================================
// Refresh Token Success (interceptor refreshed token – do NOT navigate)
// ============================================================
export const refreshTokenSuccess = createAction(
  '[Auth] Refresh Token Success',
  props<{ user: AuthUser }>()
);

// ============================================================
// Session Expired (triggered by 401 interceptor)
// ============================================================
export const sessionExpired = createAction('[Auth] Session Expired');

// ============================================================
// Clear errors
// ============================================================
export const clearError = createAction('[Auth] Clear Error');

// ============================================================
// Forgot Password
// ============================================================
export const forgotPassword = createAction(
  '[Auth] Forgot Password',
  props<{ data: ForgotPasswordRequest }>()
);

export const forgotPasswordSuccess = createAction('[Auth] Forgot Password Success');

export const forgotPasswordFailure = createAction(
  '[Auth] Forgot Password Failure',
  props<{ error: string }>()
);

// ============================================================
// Reset Password (auto-login after reset)
// ============================================================
export const resetPassword = createAction(
  '[Auth] Reset Password',
  props<{ data: ResetPasswordRequest }>()
);

export const resetPasswordSuccess = createAction(
  '[Auth] Reset Password Success',
  props<{ user: AuthUser }>()
);

export const resetPasswordFailure = createAction(
  '[Auth] Reset Password Failure',
  props<{ error: string }>()
);

// ============================================================
// Update user in store
// ============================================================
export const updateUser = createAction(
  '[Auth] Update User',
  props<{ user: AuthUser }>()
);
