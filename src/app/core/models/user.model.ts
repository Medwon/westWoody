// User roles
export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';

// User model
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Auth state for NgRx
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Login
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Register
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles?: UserRole[];
}

export interface RegisterResponse {
  message: string;
  userId: string;
}

// Activate account
export interface ActivateAccountRequest {
  token: string;
  username: string;
  password: string;
}

export interface ActivateAccountResponse {
  message: string;
}

// Invite user
export interface InviteUserRequest {
  email: string;
  firstName: string;
  lastName: string;
}

export interface InviteUserResponse {
  message: string;
  userId: string;
}

// Update user
export interface UpdateUserRequest {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

// API Error response
export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}
