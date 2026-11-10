import { Routes } from '@angular/router';

import { modalsClosedGuard } from './shared/guards/modals-closed-guard';
import { authGuard } from './users/guards/auth-guard';
import { ForgotPassword } from './users/components/forgot-password/forgot-password';
import { Login } from './users/components/login/login';
import { Register } from './users/components/register/register';
import { RegisterComplete } from './users/components/register-complete/register-complete';
import { registrationResolver } from './users/resolvers/registration-resolver';
import { ResetPassword } from './users/components/reset-password/reset-password';
import { passwordResetResolver } from './users/resolvers/password-reset-resolver';
import { WishPage } from './wishes/components/wish-item/wish-page/wish-page';
import { wishResolver } from './wishes/resolvers/wish-resolver';

export const routes: Routes = [
  { path: 'people', loadChildren: () => import('./people/people.routes').then(m => m.routes) },
  {
    path: 'users',
    children: [
      { path: 'login', component: Login },
      { path: 'register', component: Register },
      { path: 'register/:token', component: RegisterComplete, resolve: { registration: registrationResolver } },
      { path: 'forgotpassword', component: ForgotPassword },
      { path: 'resetpassword/:token', component: ResetPassword, resolve: { passwordReset: passwordResetResolver } }
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
