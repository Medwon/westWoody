// User roles
export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';

// Auth User - returned from auth endpoints
// Note: id can be UUID string or number, firstName/lastName are optional (not returned by activate endpoint)
export interface AuthUser {
  id: string | number;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: UserRole[];
}

// Full User model - for user management endpoints
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

// User Profile - returned from /user/profile endpoint
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: UserRole[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Update Profile Request
export interface UpdateProfileRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

// Change Password Request
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Auth state for NgRx (stored ONLY in memory)
export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

// Login
export interface LoginRequest {
  email: string;
  password: string;
}

// Register
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles?: UserRole[];
}

// Activate account (for invited users)
export interface ActivateAccountRequest {
  token: string;
  password: string;
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
