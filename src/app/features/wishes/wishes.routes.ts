import { Routes } from '@angular/router';
import { modalsClosedGuard } from '../../shared/guards/modals-closed-guard';
import { authGuard } from '../users/guards/auth-guard';
import { WishPage } from './components/wish-item/wish-page/wish-page';

export const routes: Routes = [
  { path: ':wishId', component: WishPage, canActivate: [authGuard, modalsClosedGuard] }
];
