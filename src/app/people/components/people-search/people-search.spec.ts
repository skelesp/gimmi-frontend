import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';

import { Person } from '../../models/person.model';
import { PeopleService } from '../../service/people.service';
import { PeopleSearch } from './people-search';

// Zoekveld voor wenslijsten van andere personen in de navigatiebalk.
describe('PeopleSearch', () => {
    const ria = new Person('ria', 'Ria', 'Receiver');
    const rob = new Person('rob', 'Rob', 'Reservator');
    let fixture: ComponentFixture<PeopleSearch>;
    let people$: BehaviorSubject<Person[]>;
    let peopleService: Record<string, any>;
    let router: Record<string, any>;

    function zoek(term: string): Person[] {
        let uitkomst: Person[];
        const tekst$ = new Subject<string>();
        fixture.componentInstance.search(tekst$).subscribe(r => uitkomst = r);
        fixture.componentInstance.focus$.next(term);
        return uitkomst;
    }

    beforeEach(async () => {
        people$ = new BehaviorSubject<Person[]>([ria, rob]);
        peopleService = { people: people$.asObservable(), retrievePeopleList: vi.fn() };
        router = { navigate: vi.fn() };
        await TestBed.configureTestingModule({
            imports: [PeopleSearch],
            providers: [
                { provide: PeopleService, useValue: peopleService },
                { provide: Router, useValue: router }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(PeopleSearch);
        await fixture.whenStable();
    });

    it('haalt de lijst met personen op en volgt wijzigingen', () => {
        expect(peopleService.retrievePeopleList).toHaveBeenCalled();
        expect(fixture.componentInstance.people).toEqual([ria, rob]);
        people$.next([ria]);
        expect(fixture.componentInstance.people).toEqual([ria]);
    });

    it('zoekt op een deel van de naam, ongeacht hoofdletters', () => {
        expect(zoek('RIA')).toEqual([ria]);
    });

    it('geeft [null] als niemand past, zodat de sjabloon "niet gevonden" toont', () => {
        expect(zoek('zzz')).toEqual([null]);
    });

    it('geeft niets bij een lege zoekterm', () => {
        expect(zoek('')).toEqual([]);
    });

    it('toont maximaal 10 resultaten', () => {
        people$.next(Array.from({ length: 15 }, (_, i) => new Person('p' + i, 'Piet' + i, 'Test')));
        expect(zoek('piet').length).toBe(10);
    });

    it('toont de volledige naam in het zoekveld', () => {
        expect(fixture.componentInstance.inputFormatter(ria)).toBe('Ria Receiver');
    });

    it('een gekozen persoon opent diens lijst', () => {
        const event = { preventDefault: vi.fn(), item: ria };
        fixture.componentInstance.onPersonSelect(event);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/people', 'ria']);
        expect(fixture.componentInstance.selectedPerson).toBeNull();
    });

    it('"niet gevonden" kiezen opent het uitnodigen', () => {
        fixture.componentInstance.onPersonSelect({ preventDefault: vi.fn(), item: null });
        expect(router.navigate).toHaveBeenCalledWith(['/people/invite']);
    });

    it('stopt met luisteren bij het verdwijnen van het zoekveld', () => {
        fixture.destroy();
        expect(people$.observers.length).toBe(0);
    });
});
