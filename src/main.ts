import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling, TitleStrategy } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { isDevMode, APP_INITIALIZER, inject } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { appReducers } from './app/core/store/app.reducer';
import { AuthEffects } from './app/core/store/auth/auth.effects';
import { authInterceptor } from './app/core/services/http-interceptor.service';
import { AppInitService } from './app/core/services/app-init.service';
import { CustomTitleStrategy } from './app/core/services/custom-title-strategy.service';

/**
 * App initializer factory
 * Checks auth session on app startup via /auth/me endpoint
 */
function initializeApp(): () => Promise<void> {
  const appInitService = inject(AppInitService);
  return () => appInitService.initializeApp();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      })
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore(appReducers),
    provideEffects([AuthEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
      trace: false,
      traceLimit: 75
    }),
    // Custom title strategy for dynamic page titles
    {
      provide: TitleStrategy,
      useClass: CustomTitleStrategy
    },
    // Initialize auth check on app startup
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      multi: true
    }
  ]
}).catch(err => console.error(err));

