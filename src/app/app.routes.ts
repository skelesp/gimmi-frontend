import { Routes } from '@angular/router';

import { modalsClosedGuard } from './shared/guards/modals-closed-guard';

export const routes: Routes = [
  { path: 'people', loadChildren: () => import('./features/people/people.routes').then(m => m.routes) },
  { path: 'users', loadChildren: () => import('./features/users/users.routes').then(m => m.routes) },
  { path: 'wishes', loadChildren: () => import('./features/wishes/wishes.routes').then(m => m.routes) },
  {
    path: '', canActivate: [modalsClosedGuard], pathMatch: 'full',
    loadComponent: () => import('./features/landing-page/landing-page').then(m => m.LandingPage)
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
