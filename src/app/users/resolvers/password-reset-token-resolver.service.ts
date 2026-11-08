import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UserService } from '../service/user.service';

@Injectable({
  providedIn: 'root'
})
export class PasswordResetTokenResolver  {
  private userService = inject(UserService);

  
  resolve ( route : ActivatedRouteSnapshot, state: RouterStateSnapshot ) : Observable<boolean> | boolean {
    return this.userService.validatePasswordResetToken(route.paramMap.get('token')).pipe(
      catchError(() => { return of(false)}),
      map(token => { return token ? true : false;})
    ); 
  }

}
