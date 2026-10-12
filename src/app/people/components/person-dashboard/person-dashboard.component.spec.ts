import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of } from 'rxjs';

import { User } from 'src/app/users/models/user.model';
import { UserService } from 'src/app/users/service/user.service';
import { Person } from '../../models/person.model';
import { PeopleService } from '../../service/people.service';
import { PersonDashboardComponent } from './person-dashboard.component';

// Overzichtspagina van een persoon op /people/:personId (sc-1959): naam, delen, extra info en
// de wenslijst.
describe('PersonDashboardComponent', () => {
  let fixture: ComponentFixture<PersonDashboardComponent>;
  let currentUser$: BehaviorSubject<User>;
  const ilse = new User('ilse', 'Ingelogd', 'Ilse', 'ilse@gimmi.be', 'local', 't', {});

  function ria(): Person {
    const p = new Person('ria', 'Ria', 'Receiver');
    p.extraInfo = { likes: [{ text: 'Boeken', url: '' }], dislikes: [] };
    return p;
  }

  function toon(person: Person, user: User) {
    currentUser$.next(user);
    TestBed.overrideProvider(ActivatedRoute, { useValue: { data: of({ person }) } });
    fixture = TestBed.createComponent(PersonDashboardComponent);
    fixture.detectChanges();
  }

  function el(): HTMLElement { return fixture.nativeElement; }

  function kind(naam: string): any {
    return fixture.debugElement.query(e => e.name === naam);
  }

  beforeEach(async () => {
    currentUser$ = new BehaviorSubject<User>(null);
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [PersonDashboardComponent],
      providers: [
        { provide: UserService, useValue: { currentUser$: currentUser$.asObservable() } },
        { provide: PeopleService, useValue: { isEqualToCurrentUser: (p: Person) => p?.id === currentUser$.value?.id } },
        { provide: ActivatedRoute, useValue: {} }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('onbekende persoon: "geen lijst gevonden"', () => {
    toon(null, ilse);
    expect(el().querySelector('ngb-alert').textContent).toContain('Sorry, geen lijst gevonden.');
    expect(kind('gimmi-wish-list')).toBeNull();
  });

  it('toont de naam, deelknop en de wenslijst van de persoon', () => {
    const p = ria();
    toon(p, ilse);
    expect(el().querySelector('h1').textContent.trim()).toBe('Ria Receiver');
    expect(kind('gimmi-share').nativeElement.personToShare).toBe(p);
    expect(kind('gimmi-wish-list').nativeElement.receiver).toBe(p);
  });

  it('lijst van een ander: link "Ga naar mijn lijst"; extra info alleen-lezen', () => {
    toon(ria(), ilse);
    const link: HTMLAnchorElement = el().querySelector('a.badge');
    expect(link.textContent.trim()).toBe('Ga naar mijn lijst');
    expect(link.hidden).toBeFalse();
    expect(link.getAttribute('href')).toBe('/people/ilse');
    expect(fixture.componentInstance.personIsUser).toBeFalse();
    expect(kind('gimmi-extra-info').nativeElement.personIsUser).toBeFalse();
  });

  it('eigen lijst: link verborgen en extra info bewerkbaar', () => {
    toon(ria(), new User('ria', 'Receiver', 'Ria', 'ria@gimmi.be', 'local', 't', {}));
    expect((el().querySelector('a.badge') as HTMLElement).hidden).toBeTrue();
    expect(fixture.componentInstance.personIsUser).toBeTrue();
    expect(kind('gimmi-extra-info').nativeElement.personIsUser).toBeTrue();
  });

  it('niet ingelogd: geen link naar een eigen lijst', () => {
    toon(ria(), null);
    expect(el().querySelector('a.badge')).toBeNull();
  });

  it('geeft voornaam en extra info door, en neemt bewaarde extra info over', () => {
    toon(ria(), ilse);
    const extra = kind('gimmi-extra-info');
    expect(extra.nativeElement.firstName).toBe('Ria');
    expect(extra.nativeElement.likes).toEqual([{ text: 'Boeken', url: '' }]);

    const nieuw = { likes: [{ text: 'Puzzels', url: '' }], dislikes: [{ text: 'Sokken', url: '' }] };
    extra.triggerEventHandler('extraInfoSaved', nieuw);
    fixture.detectChanges();
    expect(fixture.componentInstance.person.extraInfo).toBe(nieuw);
    expect(extra.nativeElement.dislikes).toEqual([{ text: 'Sokken', url: '' }]);
  });
});
