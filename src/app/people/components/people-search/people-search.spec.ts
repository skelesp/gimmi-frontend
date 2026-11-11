import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { ApiProblem } from '../../../core/api/api-problem';
import { ProblemNotifier } from '../../../core/api/problem-notifier';
import { People, PersonRef } from '../../service/people';
import { PeopleSearch, PersonResult } from './people-search';

// Zoekveld voor wenslijsten van andere personen in de navigatiebalk.
describe('PeopleSearch', () => {
    const ria: PersonRef = { id: 'ria', firstName: 'Ria', lastName: 'Receiver' };
    const riaResult: PersonResult = { ...ria, fullName: 'Ria Receiver' };
    let fixture: ComponentFixture<PeopleSearch>;
    let people: { search: ReturnType<typeof vi.fn> };
    let problems: { show: ReturnType<typeof vi.fn> };
    let router: Record<string, any>;

    function zoek(term: string): (PersonResult | null)[] {
        let uitkomst: (PersonResult | null)[];
        const tekst$ = new Subject<string>();
        fixture.componentInstance.search(tekst$).subscribe(r => uitkomst = r);
        fixture.componentInstance.focus$.next(term);
        return uitkomst;
    }

    beforeEach(async () => {
        people = { search: vi.fn().mockName('People.search').mockReturnValue(of([ria])) };
        problems = { show: vi.fn().mockName('ProblemNotifier.show') };
        router = { navigate: vi.fn() };
        await TestBed.configureTestingModule({
            imports: [PeopleSearch],
            providers: [
                { provide: People, useValue: people },
                { provide: ProblemNotifier, useValue: problems },
                { provide: Router, useValue: router }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(PeopleSearch);
        await fixture.whenStable();
    });

    it('vraagt de server naar de zoekterm en toont de volledige naam', () => {
        expect(zoek('ria')).toEqual([riaResult]);
        expect(people.search).toHaveBeenCalledWith('ria');
    });

    it('geeft [null] als niemand past, zodat de sjabloon "niet gevonden" toont', () => {
        people.search.mockReturnValue(of([]));
        expect(zoek('zzz')).toEqual([null]);
    });

    it('onder 2 tekens geen aanroep', () => {
        expect(zoek('')).toEqual([]);
        expect(zoek(' r ')).toEqual([]);
        expect(people.search).not.toHaveBeenCalled();
    });

    it('een fout van de server wordt gemeld en geeft geen resultaten', () => {
        const problem = new ApiProblem({ status: 429, code: 'rate-limited' as never });
        people.search.mockReturnValue(throwError(() => problem));
        expect(zoek('ria')).toEqual([]);
        expect(problems.show).toHaveBeenCalledWith(problem);
    });

    it('toont de volledige naam in het zoekveld', () => {
        expect(fixture.componentInstance.inputFormatter(riaResult)).toBe('Ria Receiver');
    });

    it('een gekozen persoon opent diens lijst', () => {
        const event = { preventDefault: vi.fn(), item: riaResult };
        fixture.componentInstance.onPersonSelect(event);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/people', 'ria']);
        expect(fixture.componentInstance.searchInput().nativeElement.value).toBe('');
    });

    it('"niet gevonden" kiezen opent het uitnodigen', () => {
        fixture.componentInstance.onPersonSelect({ preventDefault: vi.fn(), item: null });
        expect(router.navigate).toHaveBeenCalledWith(['/people/invite']);
    });
});
