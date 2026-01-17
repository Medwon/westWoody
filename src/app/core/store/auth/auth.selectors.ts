import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from '../../models/user.model';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectUser = createSelector(
  selectAuthState,
  (state: AuthState) => state.user
);

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state: AuthState) => state.isAuthenticated
);

export const selectIsLoading = createSelector(
  selectAuthState,
  (state: AuthState) => state.isLoading
);

export const selectIsInitialized = createSelector(
  selectAuthState,
  (state: AuthState) => state.isInitialized
);

export const selectAuthError = createSelector(
  selectAuthState,
  (state: AuthState) => state.error
);

// Composite selectors
export const selectUserRoles = createSelector(
  selectUser,
  (user) => user?.roles ?? []
);

export const selectUserEmail = createSelector(
  selectUser,
  (user) => user?.email ?? ''
);

export const selectUserId = createSelector(
  selectUser,
  (user) => user?.id ?? null
);

export const selectUserFullName = createSelector(
  selectUser,
  (user) => {
    if (!user) return '';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  }
);

export const selectIsAdmin = createSelector(
  selectUserRoles,
  (roles) => roles.includes('ADMIN')
);

export const selectIsManager = createSelector(
  selectUserRoles,
  (roles) => roles.includes('MANAGER') || roles.includes('ADMIN')
);

// Auth ready selector - true when auth check is complete
export const selectAuthReady = createSelector(
  selectIsInitialized,
  selectIsLoading,
  (initialized, loading) => initialized && !loading
);
