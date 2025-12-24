import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app.state';
import { checkAuth } from '../store/auth/auth.actions';

@Injectable({
  providedIn: 'root'
})
export class AppInitService {
  constructor(private store: Store<AppState>) {}

  initializeApp(): Promise<void> {
    return new Promise((resolve) => {
      this.store.dispatch(checkAuth());
      resolve();
    });
  }
}

