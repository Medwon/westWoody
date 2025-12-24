import { createReducer, on } from '@ngrx/store';
import { AuthState } from '../../models/user.model';
import * as AuthActions from './auth.actions';

export const initialState: AuthState = {
  // ВРЕМЕННО: Установлено для тестирования sidebar без логина
  // ВАЖНО: Вернуть в null и false после тестирования!
  user: {
    id: '1',
    email: 'test@test.com',
    name: 'Тестовый Пользователь',
    role: 'admin'
  },
  token: 'test-token',
  isAuthenticated: true,
  isLoading: false,
  error: null
};

export const authReducer = createReducer(
  initialState,
  on(AuthActions.login, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),
  on(AuthActions.loginSuccess, (state, { response }) => ({
    ...state,
    user: response.user,
    token: response.token,
    isAuthenticated: true,
    isLoading: false,
    error: null
  })),
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
    isAuthenticated: false
  })),
  on(AuthActions.logout, (state) => ({
    ...state,
    isLoading: true
  })),
  on(AuthActions.logoutSuccess, () => initialState),
  on(AuthActions.checkAuth, (state) => ({
    ...state,
    isLoading: true
  })),
  on(AuthActions.checkAuthSuccess, (state, { user, token }) => ({
    ...state,
    user,
    token,
    isAuthenticated: true,
    isLoading: false,
    error: null
  })),
  on(AuthActions.checkAuthFailure, () => initialState)
);

