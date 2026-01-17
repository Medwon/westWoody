import { createAction, props } from '@ngrx/store';
import {
  AuthUser,
  LoginRequest,
  RegisterRequest,
  ActivateAccountRequest
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
// Session Expired (triggered by 401 interceptor)
// ============================================================
export const sessionExpired = createAction('[Auth] Session Expired');

// ============================================================
// Clear errors
// ============================================================
export const clearError = createAction('[Auth] Clear Error');

// ============================================================
// Update user in store
// ============================================================
export const updateUser = createAction(
  '[Auth] Update User',
  props<{ user: AuthUser }>()
);
