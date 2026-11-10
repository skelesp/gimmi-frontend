import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { Person, IExtraPersonInfo } from '../models/person.model';

export interface IPersonNameResponse {
  _id : string;
  firstName : string;
  lastName : string;
  fullName : string;
  id : string;
}

export interface IPersonSearchResponse {
  _id: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
  updatedAt: Date;
  extraInfo?: IExtraPersonInfo;
  birthday?: Date;
}

/**
 * What the v1 wish code still needs of a person (names behind ids, the e-mail address of a reserver).
 * Goes away with the slices that move those wishes to API v2 (sc-3288, sc-3291); the new code is `People`.
 */
@Injectable({
  providedIn: 'root'
})
export class PeopleService {
  private http$ = inject(HttpClient);

  public getPersonById( personId : string) : Observable<Person> {
    return this.http$.get<IPersonSearchResponse>( environment.apiUrl + 'people/' + personId )
    .pipe(map(personResult => new Person(personResult.id, personResult.firstName, personResult.lastName)));
  }

  public getEmailById (personId : string) : Observable<string> {
    return personId ? this.http$.get<string>(environment.apiUrl + 'people/' + personId + '/email')
      : throwError(() => new Error('No personId provided'));
  }
}
