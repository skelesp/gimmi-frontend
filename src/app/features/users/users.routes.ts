import { Routes } from '@angular/router';
import { ForgotPassword } from './components/forgot-password/forgot-password';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { RegisterComplete } from './components/register-complete/register-complete';
import { ResetPassword } from './components/reset-password/reset-password';
import { loggedOutGuard } from './guards/logged-out-guard';

export const routes: Routes = [
  { path: 'login', title: 'Inloggen', component: Login, canActivate: [loggedOutGuard] },
  { path: 'register', title: 'Registreren', component: Register },
  { path: 'register/:token', title: 'Registratie afronden', component: RegisterComplete },
  { path: 'forgotpassword', title: 'Wachtwoord vergeten', component: ForgotPassword },
  { path: 'resetpassword/:token', title: 'Wachtwoord resetten', component: ResetPassword }
];
