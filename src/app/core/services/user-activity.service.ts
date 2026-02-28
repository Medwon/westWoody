import { Injectable, OnDestroy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { interval, Subscription } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as AuthActions from '../store/auth/auth.actions';

/** Access token expires in 15 min; refresh every 10 min while user is active so session doesn't drop. */
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Service to handle user activity tracking (heartbeat)
 * Sends periodic heartbeat to server to indicate user is online.
 * Also refreshes the access token periodically so active users are not logged out.
 */
@Injectable({
  providedIn: 'root'
})
export class UserActivityService implements OnDestroy {
  private heartbeatInterval: Subscription | null = null;
  private refreshInterval: Subscription | null = null;
  private readonly HEARTBEAT_INTERVAL_MS = 60000; // 1 minute

  private store = inject(Store);
  private authService = inject(AuthService);

  constructor(private usersService: UsersService) {}

  /**
   * Start sending periodic heartbeat and proactive token refresh
   */
  startHeartbeat(): void {
    if (this.heartbeatInterval) {
      return; // Already started
    }

    // Send initial heartbeat
    this.sendHeartbeat();

    // Set up periodic heartbeat
    this.heartbeatInterval = interval(this.HEARTBEAT_INTERVAL_MS)
      .pipe(
        tap(() => this.sendHeartbeat()),
        catchError((error) => {
          console.error('Error in heartbeat interval:', error);
          return of(null);
        })
      )
      .subscribe();

    // Proactively refresh access token before it expires (15 min) so active users stay logged in
    this.refreshToken(); // extend session immediately when user is active
    this.refreshInterval = interval(REFRESH_INTERVAL_MS)
      .pipe(
        tap(() => this.refreshToken()),
        catchError(() => of(null))
      )
      .subscribe();
  }

  /**
   * Stop sending periodic heartbeat and token refresh
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      this.heartbeatInterval.unsubscribe();
      this.heartbeatInterval = null;
    }
    if (this.refreshInterval) {
      this.refreshInterval.unsubscribe();
      this.refreshInterval = null;
    }
  }

  private refreshToken(): void {
    this.authService.refresh()
      .pipe(
        catchError(() => of(null))
      )
      .subscribe((user) => {
        if (user) {
          this.store.dispatch(AuthActions.refreshTokenSuccess({ user }));
        }
      });
  }

  /**
   * Send heartbeat to server
   */
  private sendHeartbeat(): void {
    this.usersService.updateHeartbeat()
      .pipe(
        catchError((error) => {
          // Silently fail - don't spam console
          return of(null);
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.stopHeartbeat();
  }
}
