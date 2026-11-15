import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from '../../../core/api/api-client';
import type { Schema } from '../../../core/api/api-types';

export type PersonProfile = Schema<'Person'>;
export type PersonRef = Schema<'PersonRef'>;
export type PersonPreference = Schema<'PersonPreference'>;

/** People as API v2 knows them: search by name, a profile with likes and dislikes, and inviting someone. */
@Service()
export class People {
  private api = inject(ApiClient);

  /** Finds people by name (at least 2 characters, at most 20 results). There is no list of everyone. */
  search(text: string): Observable<PersonRef[]> {
    return this.api.get('/people', { query: { q: text } }).pipe(map(page => page.items));
  }

  /** The profile of a person as the viewer may see it, with what the viewer may do (`viewer.can`). */
  get(personId: string): Observable<PersonProfile> {
    return this.api.get('/people/{personId}', { path: { personId } });
  }

  /** Replaces the likes and dislikes of the person (only their own profile). */
  updatePreferences(personId: string, preferences: { likes: PersonPreference[]; dislikes: PersonPreference[] }): Observable<PersonProfile> {
    return this.api.patch('/people/{personId}', { path: { personId }, body: preferences });
  }

  /** Asks the server to mail an invitation. Always accepted; the text is fixed by the server. */
  invite(email: string): Observable<void> {
    return this.api.post('/invitations', { body: { email } });
  }
}
