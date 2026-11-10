import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { environment } from 'src/environments/environment';

/**
 * What the v1 reservation code still needs of a person: the e-mail address of whoever reserved a wish.
 * Goes away with sc-3291; the new code is `People`.
 */
@Injectable({
  providedIn: 'root'
})
export class PeopleService {
  private http$ = inject(HttpClient);

  public getEmailById (personId : string) : Observable<string> {
    return personId ? this.http$.get<string>(environment.apiUrl + 'people/' + personId + '/email')
      : throwError(() => new Error('No personId provided'));
  }
}
