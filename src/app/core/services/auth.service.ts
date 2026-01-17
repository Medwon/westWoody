import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  RegisterRequest,
  ActivateAccountRequest,
  AuthUser
} from '../models/user.model';

/**
 * Auth Service - HttpOnly Cookie Based Authentication
 * 
 * - NO tokens stored in localStorage/sessionStorage
 * - All auth state managed via NgRx (in-memory only)
 * - Cookies handled automatically by browser with withCredentials: true
 * 
 * Backend sets HttpOnly cookies:
 * - accessToken (15 min expiration)
 * - refreshToken (7 days expiration)
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  /**
   * Login with email and password
   * Sets HttpOnly cookies on success
   * @returns AuthUser { id, email, roles }
   */
  login(credentials: LoginRequest): Observable<AuthUser> {
    console.log('[AuthService] POST /auth/login', credentials);
    return this.http.post<AuthUser>(`${this.apiUrl}/login`, credentials);
  }

  /**
   * Register new user
   * Sets HttpOnly cookies on success (auto-login)
   * @returns AuthUser { id, email, roles }
   */
  register(data: RegisterRequest): Observable<AuthUser> {
    console.log('[AuthService] POST /auth/register', data);
    return this.http.post<AuthUser>(`${this.apiUrl}/register`, data);
  }

  /**
   * Activate account with invitation token
   * Sets HttpOnly cookies on success (auto-login)
   * @returns AuthUser { id, email, roles }
   */
  activate(data: ActivateAccountRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.apiUrl}/activate`, data);
  }

  /**
   * Get current authenticated user
   * Used on app init to check if session is valid
   * @returns AuthUser { id, email, roles }
   */
  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.apiUrl}/me`);
  }

  /**
   * Refresh access token using refresh token cookie
   * Sets new HttpOnly cookies
   * @returns AuthUser { id, email, roles }
   */
  refresh(): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.apiUrl}/refresh`, {});
  }

  /**
   * Logout - Revokes refresh token and clears cookies
   */
  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {});
  }
}
