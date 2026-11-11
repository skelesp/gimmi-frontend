import { Component, ChangeDetectionStrategy, ElementRef, inject, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject, merge, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap } from "rxjs/operators";
import { faSearch, faUserCircle } from "@fortawesome/free-solid-svg-icons";
import { ApiProblem } from '../../../core/api/api-problem';
import { ProblemNotifier } from '../../../core/api/problem-notifier';
import { People, PersonRef } from '../../service/people';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';

import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgbHighlight, NgbTypeahead as NgbTypeahead_1 } from '@ng-bootstrap/ng-bootstrap/typeahead';

/** A search result as the typeahead shows it. */
export type PersonResult = PersonRef & { fullName: string };

// The server needs at least 2 characters.
const minSearchLength = 2;

@Component({
    selector: 'gimmi-people-search',
    templateUrl: './people-search.html',
    styleUrls: ['./people-search.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FaIconComponent, NgbHighlight, NgbTypeahead_1]
})
export class PeopleSearch {
  private people = inject(People);
  private problems = inject(ProblemNotifier);
  private router = inject(Router);

  // Ngbtypeahead variables
  readonly instance = viewChild<NgbTypeahead>('instance');
  readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  focus$ = new Subject<string>();
  click$ = new Subject<string>();
  // Icons variables
  userIcon = faUserCircle;
  searchIcon = faSearch;

  search = (text$: Observable<string>) : Observable<(PersonResult | null)[]> => {
    const debouncedText$ = text$.pipe(
      debounceTime(200),
      distinctUntilChanged()
    );
    const clickWithClosedPopup$ = this.click$.pipe(filter(() => !this.instance().isPopupOpen()));
    const inputFocused$ = this.focus$;

    return merge(debouncedText$, clickWithClosedPopup$, inputFocused$).pipe(
      switchMap(term => {
        const text = term.trim();
        if (text.length < minSearchLength) return of([]);
        return this.people.search(text).pipe(
          map(found => found.length > 0
            ? found.map(person => ({ ...person, fullName: `${person.firstName} ${person.lastName}` }))
            : [null] // [null] is needed to detect the "no results" scenario in the people search HTML, because ng-bootstrap doesn't support "noresults scenario"
          ),
          catchError(error => {
            if (error instanceof ApiProblem) this.problems.show(error);
            else console.error(error);
            return of([]);
          })
        );
      })
    );
  }

  inputFormatter (person: PersonResult) {
    return `${person.fullName}`;
  }

  onPersonSelect($event: { preventDefault(): void; item?: PersonResult | null }) {
    $event.preventDefault();
    if ($event.item) {
      const personId = $event.item.id;
      this.router.navigate(['/people', personId]);
    } else {
      this.router.navigate(['/people/invite']);
    }
    // `preventDefault` keeps the typeahead from writing the person in the field: empty it for the next search.
    const input = this.searchInput();
    if (input) input.nativeElement.value = '';
  }
}
