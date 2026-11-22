import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth-store';

/** `/users/:userId` is the page of your own account: someone else's id leads to your own. Runs after `authGuard`. */
export const ownAccountGuard: CanActivateFn = next => {
  const user = inject(AuthStore).user();
  if (!user || next.paramMap.get('userId') === user.id) {
    return true;
  }
  return inject(Router).createUrlTree(['/users', user.id]);
};
