import { Routes } from '@angular/router';
import { activationGuard } from '../../core/guards/activation.guard';
import { resetPasswordGuard } from '../../core/guards/reset-password.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login-page/login-page.component').then(m => m.LoginPageComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register-page/register-page.component').then(m => m.RegisterPageComponent)
  },
  {
    path: 'activation',
    loadComponent: () => import('./pages/activation-page/activation-page.component').then(m => m.ActivationPageComponent),
    canActivate: [activationGuard]
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password-page/forgot-password-page.component').then(m => m.ForgotPasswordPageComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password-page/reset-password-page.component').then(m => m.ResetPasswordPageComponent),
    canActivate: [resetPasswordGuard]
  }
];

