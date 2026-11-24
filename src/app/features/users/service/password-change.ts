import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ApiClient } from '../../../core/api/api-client';
import { AuthStore, CurrentUser } from '../../../core/auth/auth-store';

/** Changing the password of the logged-in person. Every older token stops working, so the answer is a new one. */
@Service()
export class PasswordChange {
  private api = inject(ApiClient);
  private auth = inject(AuthStore);

  /** Sets the new password and carries on with the new token. A wrong current password is a 422 `current-password-incorrect`. */
  change(currentPassword: string, newPassword: string): Observable<CurrentUser> {
    return this.api.put('/me/password', { body: { currentPassword, newPassword } })
      .pipe(switchMap(token => this.auth.startSession(token)));
  }
}
