// User roles
export type UserRole = 'SUDO' | 'ADMIN' | 'MANAGER' | 'USER';

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
  username?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: UserRole[];
  active: boolean;
  accountStatus?: 'PENDING_ACTIVATION' | 'ACTIVE' | 'INACTIVE';
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

// Forgot password
export interface ForgotPasswordRequest {
  email: string;
}

// Reset password
export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// Invite user
export interface InviteUserRequest {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface InviteUserResponse {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  accountStatus: 'PENDING_ACTIVATION' | 'ACTIVE' | 'INACTIVE';
  active: boolean;
}

// User Transaction
export interface UserTransaction {
  txId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  amount: number;
  status: 'COMPLETED' | 'REFUNDED' | string;
  paymentMethod?: string | null;
  enteredByUsername: string;
  createdAt: string;
  refundedPaymentTxId?: string | null;
  bonusGranted: number;
  bonusUsed: number;
  refundReason?: string | null;
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
