import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { Person } from 'src/app/people/models/person.model';
import { PeopleService } from 'src/app/people/service/people.service';
import { emailQueryParamGuard } from './email-query-param.guard';

@Component({ template: '' })
class DummyComponent { }

// sc-2250: bekend e-mailadres op de registratiepagina gaat naar login, onbekend adres op de
// loginpagina gaat naar registratie. De guard leest location.search.
describe('emailQueryParamGuard', () => {
    let people: Record<string, any>;
    let oorspronkelijk: string;

    // De guard leest het adres uit location.search, dus zet die eerst gelijk aan de gevraagde url.
    async function naar(url: string): Promise<string> {
        const vraagteken = url.indexOf('?');
        history.replaceState(null, '', location.pathname + (vraagteken === -1 ? '' : url.substring(vraagteken)));
        await RouterTestingHarness.create(url);
        return decodeURIComponent(TestBed.inject(Router).url);
    }

    beforeEach(() => {
        oorspronkelijk = location.href;
        people = {
            findPersonByEmail: vi.fn().mockName("PeopleService.findPersonByEmail")
        };
        TestBed.configureTestingModule({
            providers: [
                provideRouter([
                    { path: 'users/login', component: DummyComponent, canActivate: [emailQueryParamGuard] },
                    { path: 'users/register', component: DummyComponent, canActivate: [emailQueryParamGuard] }
                ]),
                { provide: PeopleService, useValue: people }
            ]
        });
        vi.spyOn(console, 'info').mockReturnValue(undefined);
    });

    afterEach(() => history.replaceState(null, '', oorspronkelijk));

    it('zonder ?e=: gewoon doorlaten, niets opzoeken', async () => {
        expect(await naar('/users/register')).toBe('/users/register');
        expect(people.findPersonByEmail).not.toHaveBeenCalled();
    });

    it('registratie met een bekend adres: naar login, met het adres en redirected=true', async () => {
        people.findPersonByEmail.mockReturnValue(of(new Person('p1', 'Ria', 'Receiver')));
        expect(await naar('/users/register?e=ria%40gimmi.be')).toBe('/users/login?e=ria@gimmi.be&redirected=true');
    });

    it('login met een onbekend adres: naar registratie', async () => {
        people.findPersonByEmail.mockReturnValue(throwError('404'));
        expect(await naar('/users/login?e=nieuw%40gimmi.be')).toBe('/users/register?e=nieuw@gimmi.be&redirected=true');
    });

    it('login met een bekend adres: doorlaten', async () => {
        people.findPersonByEmail.mockReturnValue(of(new Person('p1', 'Ria', 'Receiver')));
        expect(await naar('/users/login?e=ria%40gimmi.be')).toBe('/users/login?e=ria@gimmi.be');
    });

    it('al eens omgeleid (redirected): niet opnieuw omleiden, geen lus', async () => {
        people.findPersonByEmail.mockReturnValue(of(new Person('p1', 'Ria', 'Receiver')));
        expect(await naar('/users/register?e=ria%40gimmi.be&redirected=true')).toBe('/users/register?e=ria@gimmi.be&redirected=true');
    });
});
