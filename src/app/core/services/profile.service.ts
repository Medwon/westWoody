import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest
} from '../models/user.model';

/**
 * Profile Service - User Profile Management
 * 
 * Endpoints:
 * - GET /user/profile - Get current user's profile
 * - PUT /user/profile - Update profile (email, firstName, lastName, phone)
 * - PUT /user/profile/password - Change password
 */
@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly apiUrl = `${environment.apiUrl}/user/profile`;

  constructor(private http: HttpClient) {
    console.log('[ProfileService] Initialized with API URL:', this.apiUrl);
  }

  /**
   * Get current authenticated user's profile
   * @returns UserProfile with full user information
   */
  getProfile(): Observable<UserProfile> {
    console.log('[ProfileService] GET', this.apiUrl);
    return this.http.get<UserProfile>(this.apiUrl);
  }

  /**
   * Update current user's profile
   * @param data - email, firstName, lastName, phone
   * @returns Updated UserProfile
   */
  updateProfile(data: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(this.apiUrl, data);
  }

  /**
   * Change current user's password
   * @param data - currentPassword, newPassword, confirmPassword
   * @returns void (204 No Content on success)
   */
  changePassword(data: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/password`, data);
  }
}
