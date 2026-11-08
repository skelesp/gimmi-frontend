import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router, NavigationExtras } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PeopleService } from 'src/app/people/service/people.service';

@Injectable({
  providedIn: 'root'
})
export class EmailQueryParamGuard  {
  
  constructor(
    private _peopleService : PeopleService,
    private router : Router
  ) { }
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const queryParams = new URLSearchParams(location.search);

    if (queryParams.has('e')) {
      let email = queryParams.get('e');
      let redirected = queryParams.get('redirected');
      let navigationExtras : NavigationExtras = {
        queryParams : { e: email, redirected: true }
      }
      return this._peopleService.findPersonByEmail(email).pipe(
        catchError( () => { return of(null) }),
        map( person => { 
          let personFound = !!person;
          // If known person navigates to register, it's more logical to redirect to login page to login with known email (and vice versa)
          if ( state.url.indexOf('users/register') !== -1 && personFound && !redirected) {
            console.info('[EmailQueryParamGuard] User is routed to login page because email in queryParam is already known.');
            return this.router.createUrlTree(['users/login'], navigationExtras);
          } else if (state.url.indexOf('users/login') !== -1 && !personFound && !redirected) {
            console.info("[EmailQueryParamGuard] User is routed to register page because email in queryParam isn't known.");
            return this.router.createUrlTree(['users/register'], navigationExtras);
          } else {
            return true;
          }

        }),

      );
    }

    return true
  }
  
}