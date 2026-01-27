import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UpdateUserRequest, InviteUserRequest, InviteUserResponse, UserTransaction } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  // Get all users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  // Get user by ID
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  // Get user by username
  getUserByUsername(username: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/username/${username}`);
  }

  // Create user
  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  // Update user
  updateUser(id: string, data: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, data);
  }

  // Delete user
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Invite user
  inviteUser(data: InviteUserRequest): Observable<InviteUserResponse> {
    console.log('[UsersService] POST /users/invite', data);
    return this.http.post<InviteUserResponse>(`${this.apiUrl}/invite`, data);
  }

  // Get user transactions
  getUserTransactions(userId: string): Observable<UserTransaction[]> {
    return this.http.get<UserTransaction[]>(`${this.apiUrl}/${userId}/transactions`);
  }

  // Lock user
  lockUser(userId: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${userId}/lock`, {});
  }

  // Unlock user
  unlockUser(userId: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${userId}/unlock`, {});
  }

  // Delete all locked users
  deleteLockedUsers(): Observable<{ deletedCount: number }> {
    return this.http.delete<{ deletedCount: number }>(`${this.apiUrl}/locked`);
  }

  // Update heartbeat (last seen)
  updateHeartbeat(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/activity/heartbeat`, {});
  }

  // Get user status
  getUserStatus(userId: string): Observable<UserStatus> {
    return this.http.get<UserStatus>(`${this.apiUrl}/${userId}/status`);
  }

  // Get all users status
  getAllUsersStatus(): Observable<UserStatus[]> {
    return this.http.get<UserStatus[]>(`${this.apiUrl}/status`);
  }
}

export interface UserStatus {
  userId: string;
  isOnline: boolean;
  lastSeenAt: string | null;
}

