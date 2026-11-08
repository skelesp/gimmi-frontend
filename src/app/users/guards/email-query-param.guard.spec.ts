
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable, of, throwError } from 'rxjs';

import { Person } from 'src/app/people/models/person.model';
import { PeopleService } from 'src/app/people/service/people.service';
import { EmailQueryParamGuard } from './email-query-param.guard';

// sc-2250: bekend e-mailadres op de registratiepagina gaat naar login, onbekend adres op de
// loginpagina gaat naar registratie. De guard leest location.search.
describe('EmailQueryParamGuard', () => {
    let guard: EmailQueryParamGuard;
    let people: Record<string, any>;
    let router: Router;
    let oorspronkelijk: string;

    function naar(url: string, query: string): boolean | UrlTree {
        history.replaceState(null, '', location.pathname + query);
        let resultaat: boolean | UrlTree;
        const r = guard.canActivate({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot);
        if (r instanceof Observable)
            r.subscribe(v => resultaat = v);
        else
            resultaat = r as boolean | UrlTree;
        return resultaat;
    }

    beforeEach(() => {
        oorspronkelijk = location.href;
        people = {
            findPersonByEmail: vi.fn().mockName("PeopleService.findPersonByEmail")
        };
        TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            providers: [{ provide: PeopleService, useValue: people }]
        });
        guard = TestBed.inject(EmailQueryParamGuard);
        router = TestBed.inject(Router);
        vi.spyOn(console, 'info').mockReturnValue(undefined);
    });

    afterEach(() => history.replaceState(null, '', oorspronkelijk));

    it('zonder ?e=: gewoon doorlaten, niets opzoeken', () => {
        expect(naar('/users/register', '')).toBe(true);
        expect(people.findPersonByEmail).not.toHaveBeenCalled();
    });

    it('registratie met een bekend adres: naar login, met het adres en redirected=true', () => {
        people.findPersonByEmail.mockReturnValue(of(new Person('p1', 'Ria', 'Receiver')));
        const r = naar('/users/register?e=ria@gimmi.be', '?e=ria%40gimmi.be');
        expect(router.serializeUrl(r as UrlTree)).toBe('/users/login?e=ria@gimmi.be&redirected=true');
    });

    it('login met een onbekend adres: naar registratie', () => {
        people.findPersonByEmail.mockReturnValue(throwError('404'));
        const r = naar('/users/login?e=nieuw@gimmi.be', '?e=nieuw%40gimmi.be');
        expect(router.serializeUrl(r as UrlTree)).toBe('/users/register?e=nieuw@gimmi.be&redirected=true');
    });

    it('login met een bekend adres: doorlaten', () => {
        people.findPersonByEmail.mockReturnValue(of(new Person('p1', 'Ria', 'Receiver')));
        expect(naar('/users/login?e=ria@gimmi.be', '?e=ria%40gimmi.be')).toBe(true);
    });

    it('al eens omgeleid (redirected): niet opnieuw omleiden, geen lus', () => {
        people.findPersonByEmail.mockReturnValue(of(new Person('p1', 'Ria', 'Receiver')));
        expect(naar('/users/register?e=ria@gimmi.be&redirected=true', '?e=ria%40gimmi.be&redirected=true')).toBe(true);
    });
});
