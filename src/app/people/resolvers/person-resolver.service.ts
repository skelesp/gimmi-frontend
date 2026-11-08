import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Person } from '../models/person.model';
import { PeopleService } from '../service/people.service';

@Injectable({
  providedIn: 'root'
})
export class PersonResolver {

  constructor(
    private peopleService : PeopleService
  ) { }

  resolve( route: ActivatedRouteSnapshot, state: RouterStateSnapshot) : Observable<Person> {
    return this.peopleService.getPersonById(route.paramMap.get('personId'))
      .pipe(
        catchError( () => { return of(null); })
      );
  }
}
