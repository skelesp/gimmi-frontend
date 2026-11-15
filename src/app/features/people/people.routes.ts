import { Routes } from '@angular/router';
import { modalsClosedGuard } from '../../shared/guards/modals-closed-guard';
import { authGuard } from '../users/guards/auth-guard';
import { Invite } from './components/invite/invite';
import { PersonDashboard } from './components/person-dashboard/person-dashboard';
import { personResolver } from './resolvers/person-resolver';

export const routes: Routes = [
  { path: 'invite', component: Invite, canActivate: [authGuard, modalsClosedGuard] },
  { path: ':personId', component: PersonDashboard, resolve: { person: personResolver }, canActivate: [authGuard, modalsClosedGuard] }
];
