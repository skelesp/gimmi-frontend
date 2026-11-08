import { Routes } from '@angular/router';

import { InviteComponent } from './people/components/invite/invite.component';
import { PersonDashboardComponent } from './people/components/person-dashboard/person-dashboard.component';
import { PersonResolver } from './people/resolvers/person-resolver.service';
import { ModalsClosedGuard } from './shared/guards/modals-closed.guard';
import { AuthGuard } from './users/guards/auth.guard';
import { EmailQueryParamGuard } from './users/guards/email-query-param.guard';
import { ForgotPasswordComponent } from './users/components/forgot-password/forgot-password.component';
import { LoginComponent } from './users/components/login/login.component';
import { RegisterComponent } from './users/components/register/register.component';
import { ResetPasswordComponent } from './users/components/reset-password/reset-password.component';
import { PasswordResetTokenResolver } from './users/resolvers/password-reset-token-resolver.service';
import { WishPageComponent } from './wishes/components/wish-item/wish-page/wish-page.component';
import { WishResolver } from './wishes/resolvers/wish-resolver.service';

export const routes: Routes = [
  {
    path: 'people', children: [
      { path: 'invite', component: InviteComponent, canActivate: [AuthGuard, ModalsClosedGuard] }
    ]
  },
  {
    path: 'people/:personId', component: PersonDashboardComponent, resolve: { person: PersonResolver }, canActivate: [AuthGuard, ModalsClosedGuard]
  },
  {
    path: 'users',
    children: [
      { path: 'login', component: LoginComponent, canActivate: [EmailQueryParamGuard] },
      { path: 'register', component: RegisterComponent, canActivate: [EmailQueryParamGuard] },
      { path: 'forgotpassword', component: ForgotPasswordComponent },
      { path: 'resetpassword/:token', component: ResetPasswordComponent, resolve: { validToken: PasswordResetTokenResolver } }
    ]
  },
  {
    path: 'wishes/:wishId', component: WishPageComponent, resolve: { wish: WishResolver }, canActivate: [AuthGuard, ModalsClosedGuard]
  },
  {
    path: '', canActivate: [ModalsClosedGuard], pathMatch: 'full',
    loadComponent: () => import('./landing-page/landing-page.component').then(m => m.LandingPageComponent)
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
