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
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./features/home/pages/home-page/home-page.component').then(m => m.HomePageComponent),
        title: 'Home'
      },
      {
        path: 'bonus-expiring',
        loadComponent: () => import('./features/bonus-expiring/pages/bonus-expiring-page/bonus-expiring-page.component').then(m => m.BonusExpiringPageComponent),
        title: 'Bonus Expiring'
      },
      {
        path: 'communications',
        title: 'Communications',
        children: [
          {
            path: '',
            redirectTo: 'whatsapp',
            pathMatch: 'full'
          },
          {
            path: 'whatsapp',
            loadComponent: () => import('./features/invitation/pages/invitation-page/invitation-page.component').then(m => m.InvitationPageComponent),
            title: 'WhatsApp'
          }
          // {
          //   path: 'email',
          //   loadComponent: () => import('./features/invitation/pages/email-invitation-page/email-invitation-page.component').then(m => m.EmailInvitationPageComponent)
          // }
        ]
      },
      {
        path: 'reports/bonus-types',
        loadComponent: () => import('./features/reports/pages/bonus-type-report-page/bonus-type-report-page.component').then(m => m.BonusTypeReportPageComponent),
        title: 'Отчёт по типам бонусов'
      },
      {
        path: 'reward-programs',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/bonus-program/pages/bonus-program-page/bonus-program-page.component').then(m => m.BonusProgramPageComponent),
            title: 'Reward Programs'
          },
          {
            path: 'programs',
            loadComponent: () => import('./features/bonus-program/pages/program-types-page/program-types-page.component').then(m => m.ProgramTypesPageComponent),
            title: 'Create Program'
          },
          /* Cashback: full wizard with routable steps */
          {
            path: 'create/cashback/:uuid',
            redirectTo: 'create/cashback/:uuid/steps/1',
            pathMatch: 'full'
          },
          {
            path: 'create/cashback/:uuid/steps/:step',
            loadComponent: () => import('./features/bonus-program/pages/create-program-wizard/create-program-wizard.component').then(m => m.CreateProgramWizardComponent),
            title: 'Create Cashback Program'
          },
          /* Welcome: full wizard (no weekly schedule) */
          {
            path: 'create/welcome/:uuid',
            redirectTo: 'create/welcome/:uuid/steps/1',
            pathMatch: 'full'
          },
          {
            path: 'create/welcome/:uuid/steps/:step',
            loadComponent: () => import('./features/bonus-program/pages/create-welcome-program-wizard/create-welcome-program-wizard.component').then(m => m.CreateWelcomeProgramWizardComponent),
            title: 'Create Welcome Program'
          },
          /* Other types: in development */
          {
            path: 'create/birthday/:uuid',
            loadComponent: () => import('./features/bonus-program/pages/reward-program-create-page/reward-program-create-page.component').then(m => m.RewardProgramCreatePageComponent),
            title: 'Create Birthday Program'
          },
          {
            path: 'create/referral/:uuid',
            loadComponent: () => import('./features/bonus-program/pages/reward-program-create-page/reward-program-create-page.component').then(m => m.RewardProgramCreatePageComponent),
            title: 'Create Referral Program'
          },
          {
            path: 'view/:uuid',
            redirectTo: 'view/:uuid/overview',
            pathMatch: 'full'
          },
          {
            path: 'view/:uuid/tier/:tierName',
            loadComponent: () => import('./features/bonus-program/pages/program-tier-page/program-tier-page.component').then(m => m.ProgramTierPageComponent),
            title: 'Tier'
          },
          {
            path: 'view/:uuid/:tab',
            loadComponent: () => import('./features/bonus-program/pages/program-view-page/program-view-page.component').then(m => m.ProgramViewPageComponent),
            title: 'View Program'
          },
          {
            path: 'configure/:type/:uuid',
            loadComponent: () => import('./features/bonus-program/pages/reward-program-configure-page/reward-program-configure-page.component').then(m => m.RewardProgramConfigurePageComponent),
            title: 'Configure Reward Program'
          }
        ]
      },
      {
        path: 'bonus-management',
        loadComponent: () => import('./features/bonus-management/pages/bonus-management-page/bonus-management-page.component').then(m => m.BonusManagementPageComponent),
        title: 'Bonus Management'
      },
      {
        path: 'clients',
        loadComponent: () => import('./features/clients/pages/clients-page/clients-page.component').then(m => m.ClientsPageComponent),
        title: 'Clients'
      },
      {
        path: 'clients/:id',
        loadComponent: () => import('./features/profile/pages/profile-page/profile-page.component').then(m => m.ProfilePageComponent),
        title: 'Client'
      },
      {
        path: 'clients/:id/:section',
        loadComponent: () => import('./features/profile/pages/profile-page/profile-page.component').then(m => m.ProfilePageComponent),
        title: 'Client'
      },
      {
        path: 'payments',
        loadComponent: () => import('./features/payments/pages/payments-page/payments-page.component').then(m => m.PaymentsPageComponent),
        title: 'Payments'
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/pages/users-page/users-page.component').then(m => m.UsersPageComponent),
        title: 'Users'
      },
      {
        path: 'users/:id',
        loadComponent: () => import('./features/users/pages/user-profile-page/user-profile-page.component').then(m => m.UserProfilePageComponent),
        title: 'User'
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/users/pages/account-page/account-page.component').then(m => m.AccountPageComponent),
        title: 'Profile'
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];

