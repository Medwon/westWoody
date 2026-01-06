import { createAction, props } from '@ngrx/store';
import {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ActivateAccountRequest,
  ActivateAccountResponse
} from '../../models/user.model';

// Login
export const login = createAction(
  '[Auth] Login',
  props<{ credentials: LoginRequest }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ response: LoginResponse }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

// Register
export const register = createAction(
  '[Auth] Register',
  props<{ data: RegisterRequest }>()
);

export const registerSuccess = createAction(
  '[Auth] Register Success',
  props<{ response: RegisterResponse }>()
);

export const registerFailure = createAction(
  '[Auth] Register Failure',
  props<{ error: string }>()
);

// Activate Account
export const activateAccount = createAction(
  '[Auth] Activate Account',
  props<{ data: ActivateAccountRequest }>()
);

export const activateAccountSuccess = createAction(
  '[Auth] Activate Account Success',
  props<{ response: ActivateAccountResponse }>()
);

export const activateAccountFailure = createAction(
  '[Auth] Activate Account Failure',
  props<{ error: string }>()
);

// Logout
export const logout = createAction('[Auth] Logout');

export const logoutSuccess = createAction('[Auth] Logout Success');

// Check Auth (on app init)
export const checkAuth = createAction('[Auth] Check Auth');

export const checkAuthSuccess = createAction(
  '[Auth] Check Auth Success',
  props<{ user: User; token: string }>()
);

export const checkAuthFailure = createAction('[Auth] Check Auth Failure');

// Clear errors
export const clearError = createAction('[Auth] Clear Error');

// Update user in store
export const updateUserInStore = createAction(
  '[Auth] Update User',
  props<{ user: User }>()
);
