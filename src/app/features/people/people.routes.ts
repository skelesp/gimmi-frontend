import { Routes } from '@angular/router';
import { modalsClosedGuard } from '../../shared/guards/modals-closed-guard';
import { authGuard } from '../users/guards/auth-guard';
import { Invite } from './components/invite/invite';
import { PersonDashboard } from './components/person-dashboard/person-dashboard';

export const routes: Routes = [
  { path: 'invite', title: 'Iemand uitnodigen', component: Invite, canActivate: [authGuard, modalsClosedGuard] },
  { path: ':personId', title: 'Wensenlijst', component: PersonDashboard, canActivate: [authGuard, modalsClosedGuard] }
];
