import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UserService } from '../service/user.service';

export const passwordResetTokenResolver: ResolveFn<boolean> = (route) => {
  return inject(UserService).validatePasswordResetToken(route.paramMap.get('token')).pipe(
    catchError(() => { return of(false)}),
    map(token => { return token ? true : false;})
  ); 
};
