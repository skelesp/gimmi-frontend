import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../core/auth/auth-store';

export const authGuard: CanActivateFn = (next, state) => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (auth.user()) {
    return true;
  }
  console.error(`Auth Guard: no authenticated user found for route ${state.url}`);
  auth.attemptedUrl = state.url;
  return router.createUrlTree(['users/login']);
};
