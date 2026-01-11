import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
    canActivate: [guestGuard]
  },
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout-wrapper/main-layout-wrapper.component').then(m => m.MainLayoutWrapperComponent),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./features/home/pages/home-page/home-page.component').then(m => m.HomePageComponent)
        // canActivate: [authGuard] // Временно отключено для тестирования sidebar
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/pages/profile-page/profile-page.component').then(m => m.ProfilePageComponent)
        // canActivate: [authGuard] // Временно отключено для тестирования sidebar
      },
      {
        path: 'invitation',
        loadComponent: () => import('./features/invitation/pages/invitation-page/invitation-page.component').then(m => m.InvitationPageComponent)
        // canActivate: [authGuard]
      },
      {
        path: 'invitation-email',
        loadComponent: () => import('./features/invitation/pages/email-invitation-page/email-invitation-page.component').then(m => m.EmailInvitationPageComponent)
        // canActivate: [authGuard]
      },
      {
        path: 'bonus-program',
        loadComponent: () => import('./features/bonus-program/pages/bonus-program-page/bonus-program-page.component').then(m => m.BonusProgramPageComponent)
        // canActivate: [authGuard]
      },
      {
        path: 'clients',
        loadComponent: () => import('./features/clients/pages/clients-page/clients-page.component').then(m => m.ClientsPageComponent)
        // canActivate: [authGuard]
      },
      {
        path: 'clients/:id',
        loadComponent: () => import('./features/profile/pages/profile-page/profile-page.component').then(m => m.ProfilePageComponent)
        // canActivate: [authGuard]
      },
      {
        path: 'payments',
        loadComponent: () => import('./features/payments/pages/payments-page/payments-page.component').then(m => m.PaymentsPageComponent)
        // canActivate: [authGuard]
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/pages/users-page/users-page.component').then(m => m.UsersPageComponent)
        // canActivate: [authGuard]
      },
      {
        path: 'users/:id',
        loadComponent: () => import('./features/users/pages/user-profile-page/user-profile-page.component').then(m => m.UserProfilePageComponent)
        // canActivate: [authGuard]
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];

