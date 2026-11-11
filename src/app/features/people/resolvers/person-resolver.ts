import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { People, PersonProfile } from '../service/people';

/** The profile for the route, or `null` when the person cannot be shown (the page says "no list found"). */
export const personResolver: ResolveFn<PersonProfile | null> = (route) => {
  return inject(People).get(route.paramMap.get('personId'))
    .pipe(
      catchError( () => { return of(null); })
    );
};
