import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ApiClient } from '../../core/api/api-client';
import type { Schema } from '../../core/api/api-types';
import { AuthStore, CurrentUser } from '../../core/auth/auth-store';

/** Forgotten password: ask for a link by mail, check the link, choose a new password. Also for people who only had Facebook. */
@Service()
export class PasswordReset {
  private api = inject(ApiClient);
  private auth = inject(AuthStore);

  /** Always accepted, whether or not the address has an account. The server chooses the link. */
  request(email: string): Observable<void> {
    return this.api.post('/password-resets', { body: { email } });
  }

  /** Who the link is for. 404 (`ApiProblem`) when the link is unknown, used or expired. */
  get(resetToken: string): Observable<Schema<'PasswordResetInfo'>> {
    return this.api.get('/password-resets/{resetToken}', { path: { resetToken } });
  }

  /** Sets the password and logs the person in with the token from the answer. */
  complete(resetToken: string, password: string): Observable<CurrentUser> {
    return this.api.put('/password-resets/{resetToken}', { path: { resetToken }, body: { password } })
      .pipe(switchMap(token => this.auth.startSession(token)));
  }
}
