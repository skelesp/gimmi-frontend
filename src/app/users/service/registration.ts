import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ApiClient } from '../../core/api/api-client';
import type { Schema } from '../../core/api/api-types';
import { AuthStore, CurrentUser } from '../../core/auth/auth-store';

/** Registering in two steps: confirm the e-mail address by mail, then create the account from the link. */
@Service()
export class Registration {
  private api = inject(ApiClient);
  private auth = inject(AuthStore);

  /** Step 1: always accepted, whether or not the address has an account (the mail differs). */
  start(email: string): Observable<void> {
    return this.api.post('/registrations', { body: { email } });
  }

  /** The address a link confirms. 404 (`ApiProblem`) when the link is unknown, used or expired. */
  get(registrationToken: string): Observable<Schema<'RegistrationInfo'>> {
    return this.api.get('/registrations/{registrationToken}', { path: { registrationToken } });
  }

  /** Step 2: creates the account and logs the person in. */
  complete(registrationToken: string, details: Schema<'RegistrationCompletion'>): Observable<CurrentUser> {
    return this.api.put('/registrations/{registrationToken}', { path: { registrationToken }, body: details })
      .pipe(switchMap(token => this.auth.startSession(token)));
  }
}
