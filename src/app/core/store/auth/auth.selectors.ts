import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from '../../models/user.model';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectUser = createSelector(
  selectAuthState,
  (state: AuthState) => state.user
);

export const selectToken = createSelector(
  selectAuthState,
  (state: AuthState) => state.token
);

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state: AuthState) => state.isAuthenticated
);

export const selectIsLoading = createSelector(
  selectAuthState,
  (state: AuthState) => state.isLoading
);

export const selectAuthError = createSelector(
  selectAuthState,
  (state: AuthState) => state.error
);

// Additional selectors
export const selectUserRoles = createSelector(
  selectUser,
  (user) => user?.roles || []
);

export const selectUserFullName = createSelector(
  selectUser,
  (user) => user ? `${user.firstName} ${user.lastName}` : ''
);

export const selectIsAdmin = createSelector(
  selectUserRoles,
  (roles) => roles.includes('ADMIN')
);

export const selectIsManager = createSelector(
  selectUserRoles,
  (roles) => roles.includes('MANAGER') || roles.includes('ADMIN')
);
