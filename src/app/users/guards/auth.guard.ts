import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { UserService } from '../service/user.service';

export const authGuard: CanActivateFn = (next, state) => {
  const userService = inject(UserService);
  const router = inject(Router);

  return userService.currentUser$.pipe(
    take(1), // only take latest currentUser value and unsubscribe afterwards.
    map(user => {
      const isAuthenticated = !!user;
      if (isAuthenticated) {
        return true
      }
      console.error(`Auth Guard: no authenticated user found for route ${state.url}`);
      userService.attemptedUrl = state.url;
      return router.createUrlTree(['users/login']);
    })
  )
};
