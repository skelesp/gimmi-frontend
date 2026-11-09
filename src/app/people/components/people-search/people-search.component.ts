import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject, merge, Subscription } from 'rxjs';
import { debounceTime, map, distinctUntilChanged, filter } from "rxjs/operators";
import { faSearch, faUserCircle } from "@fortawesome/free-solid-svg-icons";
import { Person } from '../../models/person.model';
import { PeopleService } from '../../service/people.service';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';

import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgbHighlight, NgbTypeahead as NgbTypeahead_1 } from '@ng-bootstrap/ng-bootstrap/typeahead';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'gimmi-people-search',
    templateUrl: './people-search.component.html',
    styleUrls: ['./people-search.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FaIconComponent, NgbHighlight, FormsModule, NgbTypeahead_1]
})
export class PeopleSearchComponent implements OnInit, OnDestroy {
  private peopleService = inject(PeopleService);
  private router = inject(Router);
  
  // Ngbtypeahead variables
  readonly instance = viewChild<NgbTypeahead>('instance');
  focus$ = new Subject<string>();
  click$ = new Subject<string>();
  // Icons variables
  userIcon = faUserCircle;
  searchIcon = faSearch;
  // Peoplelist variables
  people: Person[] = [];
  selectedPerson: Person;
  private peopleSubscription: Subscription;

  ngOnInit(): void {
    this.peopleSubscription = this.peopleService.people.subscribe( people => {
      this.people = people; 
    });
    this.peopleService.retrievePeopleList();
  }

  search = (text$: Observable<string>) : Observable<Person[]> => {
    const debouncedText$ = text$.pipe(
      debounceTime(200),
      distinctUntilChanged()
    );
    const clickWithClosedPopup$ = this.click$.pipe(filter(() => !this.instance().isPopupOpen()));
    const inputFocused$ = this.focus$;
    
    return merge(debouncedText$, clickWithClosedPopup$, inputFocused$).pipe(
      map(term => {
        if (term !== '') {
          const results = this.people
            .filter(person => person.fullName.toLowerCase().indexOf(term.toLowerCase()) > -1)
            .slice(0, 10)
          return results.length > 0 ? results : [null] // [null] is needed to detect the "no results" scenario in the people search HTML, because ng-bootstrap doesn't support "noresults scenario"
        }
        return [] ;
      })
    );
  }

  inputFormatter (person: Person) {
    return `${person.fullName}`;
  }

  onPersonSelect($event: { preventDefault(): void; item?: Person | null }) {
    $event.preventDefault();
    if ($event.item) {
      const personId = $event.item.id;
      this.router.navigate(['/people', personId]);
    } else {
      this.router.navigate(['/people/invite']);
    }
    this.selectedPerson = null;
  }

  ngOnDestroy() {
    this.peopleSubscription.unsubscribe();
  }

}