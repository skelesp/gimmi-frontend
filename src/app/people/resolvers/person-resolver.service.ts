import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Person } from '../models/person.model';
import { PeopleService } from '../service/people.service';

export const personResolver: ResolveFn<Person> = (route) => {
  return inject(PeopleService).getPersonById(route.paramMap.get('personId'))
    .pipe(
      catchError( () => { return of(null); })
    );
};
