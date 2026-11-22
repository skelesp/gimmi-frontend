import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth-store';

/** For the login page: someone who is logged in already goes on to the page they wanted, or to their own list. */
export const loggedOutGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const user = auth.user();

  if (!user) {
    return true;
  }
  const target = auth.attemptedUrl ?? `/people/${user.id}`;
  auth.attemptedUrl = null;
  return inject(Router).parseUrl(target);
};
