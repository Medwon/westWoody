import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, take } from 'rxjs/operators';
import { initAuth } from '../store/auth/auth.actions';
import { selectIsInitialized } from '../store/auth/auth.selectors';

/**
 * App Initialization Service
 * 
 * Dispatches initAuth action on app startup to check if user has valid session.
 * Waits for auth initialization to complete before resolving.
 */
@Injectable({
  providedIn: 'root'
})
export class AppInitService {
  private store = inject(Store);

  initializeApp(): Promise<void> {
    return new Promise((resolve) => {
      // Dispatch init auth to check session via /auth/me
      this.store.dispatch(initAuth());

      // Wait for initialization to complete
      this.store.select(selectIsInitialized).pipe(
        filter(initialized => initialized),
        take(1)
      ).subscribe(() => {
        resolve();
      });
    });
  }
}

