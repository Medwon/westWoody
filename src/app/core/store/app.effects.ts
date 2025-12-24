import { Injectable } from '@angular/core';
import { Actions, createEffect } from '@ngrx/effects';
import { tap } from 'rxjs';

@Injectable()
export class AppEffects {
  constructor(private actions$: Actions) {}

  logActions$ = createEffect(
    () => {
      return this.actions$.pipe(
        tap(action => {
          if (action.type && action.type.includes('[Auth]')) {
            console.log('Auth Action:', action);
          }
        })
      );
    },
    { dispatch: false }
  );
}

