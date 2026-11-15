import type { Mock } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { ApiProblem } from '../../../../core/api/api-problem';
import { ProblemNotifier } from '../../../../core/api/problem-notifier';
import { People, PersonRef } from '../../service/people';
import { PeopleSearch, PersonResult } from './people-search';

// Search field for wish lists of other people in the navigation bar.
describe('PeopleSearch', () => {
    const ria: PersonRef = { id: 'ria', firstName: 'Ria', lastName: 'Receiver' };
    const riaResult: PersonResult = { ...ria, fullName: 'Ria Receiver' };
    let fixture: ComponentFixture<PeopleSearch>;
    let people: { search: ReturnType<typeof vi.fn> };
    let problems: { show: ReturnType<typeof vi.fn> };
    let router: Record<string, Mock>;

    function search(term: string): (PersonResult | null)[] {
        let outcome: (PersonResult | null)[];
        const text$ = new Subject<string>();
        fixture.componentInstance.search(text$).subscribe(r => outcome = r);
        fixture.componentInstance.focus$.next(term);
        return outcome;
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

    it('asks the server for the search term and shows the full name', () => {
        expect(search('ria')).toEqual([riaResult]);
        expect(people.search).toHaveBeenCalledWith('ria');
    });

    it('returns [null] if nobody matches, so the template shows "niet gevonden"', () => {
        people.search.mockReturnValue(of([]));
        expect(search('zzz')).toEqual([null]);
    });

    it('below 2 characters no call', () => {
        expect(search('')).toEqual([]);
        expect(search(' r ')).toEqual([]);
        expect(people.search).not.toHaveBeenCalled();
    });

    it('an error from the server is reported and gives no results', () => {
        const problem = new ApiProblem({ status: 429, code: 'rate-limited' as never });
        people.search.mockReturnValue(throwError(() => problem));
        expect(search('ria')).toEqual([]);
        expect(problems.show).toHaveBeenCalledWith(problem);
    });

    it('shows the full name in the search field', () => {
        expect(fixture.componentInstance.inputFormatter(riaResult)).toBe('Ria Receiver');
    });

    it('a chosen person opens their list', () => {
        const event = { preventDefault: vi.fn(), item: riaResult };
        fixture.componentInstance.onPersonSelect(event);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/people', 'ria']);
        expect(fixture.componentInstance.searchInput().nativeElement.value).toBe('');
    });

    it('choosing "niet gevonden" opens the invitation', () => {
        fixture.componentInstance.onPersonSelect({ preventDefault: vi.fn(), item: null });
        expect(router.navigate).toHaveBeenCalledWith(['/people/invite']);
    });
});
