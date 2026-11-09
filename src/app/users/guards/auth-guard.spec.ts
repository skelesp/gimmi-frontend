import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';

import { User } from '../models/user.model';
import { UserService } from '../service/user.service';
import { authGuard } from './auth-guard';

@Component({ template: '' })
class DummyComponent { }

// sc-2041: niet ingelogd -> naar login, en onthouden waar de gebruiker heen wilde.
describe('authGuard', () => {
    let users: {
        currentUser$: BehaviorSubject<User>;
        attemptedUrl: string;
    };

    beforeEach(() => {
        users = { currentUser$: new BehaviorSubject<User>(null), attemptedUrl: null };
        TestBed.configureTestingModule({
            providers: [
                provideRouter([
                    { path: 'people/:id', component: DummyComponent, canActivate: [authGuard] },
                    { path: 'users/login', component: DummyComponent }
                ]),
                { provide: UserService, useValue: users }
            ]
        });
    });

    it('ingelogd: doorlaten', async () => {
        users.currentUser$.next(new User('u1', 'R', 'Ria', 'ria@gimmi.be', 'local', 't', []));
        await RouterTestingHarness.create('/people/p9');
        expect(TestBed.inject(Router).url).toBe('/people/p9');
        expect(users.attemptedUrl).toBeNull();
    });

    it('niet ingelogd: naar login en de gevraagde url onthouden', async () => {
        vi.spyOn(console, 'error').mockReturnValue(undefined);
        await RouterTestingHarness.create('/people/p9');
        expect(TestBed.inject(Router).url).toBe('/users/login');
        expect(users.attemptedUrl).toBe('/people/p9');
    });
});
