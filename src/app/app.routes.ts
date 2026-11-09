import { Routes } from '@angular/router';

import { Invite } from './people/components/invite/invite';
import { PersonDashboard } from './people/components/person-dashboard/person-dashboard';
import { personResolver } from './people/resolvers/person-resolver';
import { modalsClosedGuard } from './shared/guards/modals-closed-guard';
import { authGuard } from './users/guards/auth-guard';
import { emailQueryParamGuard } from './users/guards/email-query-param-guard';
import { ForgotPassword } from './users/components/forgot-password/forgot-password';
import { Login } from './users/components/login/login';
import { Register } from './users/components/register/register';
import { ResetPassword } from './users/components/reset-password/reset-password';
import { passwordResetTokenResolver } from './users/resolvers/password-reset-token-resolver';
import { WishPage } from './wishes/components/wish-item/wish-page/wish-page';
import { wishResolver } from './wishes/resolvers/wish-resolver';

export const routes: Routes = [
  {
    path: 'people', children: [
      { path: 'invite', component: Invite, canActivate: [authGuard, modalsClosedGuard] }
    ]
  },
  {
    path: 'people/:personId', component: PersonDashboard, resolve: { person: personResolver }, canActivate: [authGuard, modalsClosedGuard]
  },
  {
    path: 'users',
    children: [
      { path: 'login', component: Login, canActivate: [emailQueryParamGuard] },
      { path: 'register', component: Register, canActivate: [emailQueryParamGuard] },
      { path: 'forgotpassword', component: ForgotPassword },
      { path: 'resetpassword/:token', component: ResetPassword, resolve: { validToken: passwordResetTokenResolver } }
    ]
  },
  {
    path: 'wishes/:wishId', component: WishPage, resolve: { wish: wishResolver }, canActivate: [authGuard, modalsClosedGuard]
  },
  {
    path: '', canActivate: [modalsClosedGuard], pathMatch: 'full',
    loadComponent: () => import('./landing-page/landing-page').then(m => m.LandingPage)
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
