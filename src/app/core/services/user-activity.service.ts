import { Injectable, OnDestroy } from '@angular/core';
import { UsersService } from './users.service';
import { interval, Subscription } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * Service to handle user activity tracking (heartbeat)
 * Sends periodic heartbeat to server to indicate user is online
 */
@Injectable({
  providedIn: 'root'
})
export class UserActivityService implements OnDestroy {
  private heartbeatInterval: Subscription | null = null;
  private readonly HEARTBEAT_INTERVAL_MS = 60000; // 1 minute

  constructor(private usersService: UsersService) {}

  /**
   * Start sending periodic heartbeat
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
  }

  /**
   * Stop sending periodic heartbeat
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      this.heartbeatInterval.unsubscribe();
      this.heartbeatInterval = null;
    }
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
