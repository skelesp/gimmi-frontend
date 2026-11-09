import { Routes } from '@angular/router';

import { InviteComponent } from './people/components/invite/invite.component';
import { PersonDashboardComponent } from './people/components/person-dashboard/person-dashboard.component';
import { personResolver } from './people/resolvers/person-resolver.service';
import { modalsClosedGuard } from './shared/guards/modals-closed.guard';
import { authGuard } from './users/guards/auth.guard';
import { emailQueryParamGuard } from './users/guards/email-query-param.guard';
import { ForgotPasswordComponent } from './users/components/forgot-password/forgot-password.component';
import { LoginComponent } from './users/components/login/login.component';
import { RegisterComponent } from './users/components/register/register.component';
import { ResetPasswordComponent } from './users/components/reset-password/reset-password.component';
import { passwordResetTokenResolver } from './users/resolvers/password-reset-token-resolver.service';
import { WishPageComponent } from './wishes/components/wish-item/wish-page/wish-page.component';
import { wishResolver } from './wishes/resolvers/wish-resolver.service';

export const routes: Routes = [
  {
    path: 'people', children: [
      { path: 'invite', component: InviteComponent, canActivate: [authGuard, modalsClosedGuard] }
    ]
  },
  {
    path: 'people/:personId', component: PersonDashboardComponent, resolve: { person: personResolver }, canActivate: [authGuard, modalsClosedGuard]
  },
  {
    path: 'users',
    children: [
      { path: 'login', component: LoginComponent, canActivate: [emailQueryParamGuard] },
      { path: 'register', component: RegisterComponent, canActivate: [emailQueryParamGuard] },
      { path: 'forgotpassword', component: ForgotPasswordComponent },
      { path: 'resetpassword/:token', component: ResetPasswordComponent, resolve: { validToken: passwordResetTokenResolver } }
    ]
  },
  {
    path: 'wishes/:wishId', component: WishPageComponent, resolve: { wish: wishResolver }, canActivate: [authGuard, modalsClosedGuard]
  },
  {
    path: '', canActivate: [modalsClosedGuard], pathMatch: 'full',
    loadComponent: () => import('./landing-page/landing-page.component').then(m => m.LandingPageComponent)
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
