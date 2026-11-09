import { inject } from '@angular/core';
import { CanActivateFn, Router, NavigationExtras } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PeopleService } from 'src/app/people/service/people.service';

export const emailQueryParamGuard: CanActivateFn = (next, state) => {
  const peopleService = inject(PeopleService);
  const router = inject(Router);
  const queryParams = new URLSearchParams(location.search);

  if (queryParams.has('e')) {
    const email = queryParams.get('e');
    const redirected = queryParams.get('redirected');
    const navigationExtras : NavigationExtras = {
      queryParams : { e: email, redirected: true }
    }
    return peopleService.findPersonByEmail(email).pipe(
      catchError( () => { return of(null) }),
      map( person => { 
        const personFound = !!person;
        // If known person navigates to register, it's more logical to redirect to login page to login with known email (and vice versa)
        if ( state.url.indexOf('users/register') !== -1 && personFound && !redirected) {
          console.info('[EmailQueryParamGuard] User is routed to login page because email in queryParam is already known.');
          return router.createUrlTree(['users/login'], navigationExtras);
        } else if (state.url.indexOf('users/login') !== -1 && !personFound && !redirected) {
          console.info("[EmailQueryParamGuard] User is routed to register page because email in queryParam isn't known.");
          return router.createUrlTree(['users/register'], navigationExtras);
        } else {
          return true;
        }

      }),

    );
  }

  return true
};
