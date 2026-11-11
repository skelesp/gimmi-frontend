import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiProblem } from '../../../core/api/api-problem';
import type { Schema } from '../../../core/api/api-types';
import { PasswordReset } from '../service/password-reset';

/** The pending reset behind the link, or `null` when the link is unknown, used or expired (404). */
export const passwordResetResolver: ResolveFn<Schema<'PasswordResetInfo'> | null> = route =>
  inject(PasswordReset).get(route.paramMap.get('token')!).pipe(
    catchError(error => {
      if (error instanceof ApiProblem && error.status === 404) {
        return of(null);
      }
      throw error;
    })
  );
