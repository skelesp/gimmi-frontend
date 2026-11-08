import { Component, OnInit, ViewChild, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject, merge, Subscription } from 'rxjs';
import { debounceTime, map, distinctUntilChanged, filter } from "rxjs/operators";
import { faSearch, faUserCircle } from "@fortawesome/free-solid-svg-icons";
import { Person } from '../../models/person.model';
import { PeopleService } from '../../service/people.service';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'gimmi-people-search',
    templateUrl: './people-search.component.html',
    styleUrls: ['./people-search.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PeopleSearchComponent implements OnInit, OnDestroy {  
  // Ngbtypeahead variables
  @ViewChild('instance', { static: true}) instance: NgbTypeahead;
  focus$ = new Subject<string>();
  click$ = new Subject<string>();
  // Icons variables
  userIcon = faUserCircle;
  searchIcon = faSearch;
  // Peoplelist variables
  people: Person[] = [];
  selectedPerson: Person;
  private peopleSubscription: Subscription;

  constructor( private peopleService : PeopleService, private router : Router) { }

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
    const clickWithClosedPopup$ = this.click$.pipe(filter(() => !this.instance.isPopupOpen()));
    const inputFocused$ = this.focus$;
    
    return merge(debouncedText$, clickWithClosedPopup$, inputFocused$).pipe(
      map(term => {
        if (term !== '') {
          let results = this.people
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

  onPersonSelect($event) {
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