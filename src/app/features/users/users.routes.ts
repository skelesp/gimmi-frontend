import { Routes } from '@angular/router';
import { ForgotPassword } from './components/forgot-password/forgot-password';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { RegisterComplete } from './components/register-complete/register-complete';
import { ResetPassword } from './components/reset-password/reset-password';
import { passwordResetResolver } from './resolvers/password-reset-resolver';
import { registrationResolver } from './resolvers/registration-resolver';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'register/:token', component: RegisterComplete, resolve: { registration: registrationResolver } },
  { path: 'forgotpassword', component: ForgotPassword },
  { path: 'resetpassword/:token', component: ResetPassword, resolve: { passwordReset: passwordResetResolver } }
];
