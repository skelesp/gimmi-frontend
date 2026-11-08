import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { UserService } from '../service/user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard  {

  constructor ( 
    private userService : UserService,
    private router : Router
    ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      return this.userService.currentUser$.pipe(
        take(1), // only take latest currentUser value and unsubscribe afterwards.
        map(user => {
          const isAuthenticated = !!user;
          if (isAuthenticated) {
            return true
          }
          console.error(`Auth Guard: no authenticated user found for route ${state.url}`);
          this.userService.attemptedUrl = state.url;
          return this.router.createUrlTree(['users/login']);
        })
      )
  }
  
}
