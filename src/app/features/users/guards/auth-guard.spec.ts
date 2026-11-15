import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { authGuard } from './auth-guard';

@Component({ template: '' })
class DummyComponent { }

// sc-2041: niet ingelogd -> naar login, en onthouden waar de gebruiker heen wilde.
describe('authGuard', () => {
    let auth: ReturnType<typeof fakeAuthStore>;

    beforeEach(() => {
        auth = fakeAuthStore();
        TestBed.configureTestingModule({
            providers: [
                provideRouter([
                    { path: 'people/:id', component: DummyComponent, canActivate: [authGuard] },
                    { path: 'users/login', component: DummyComponent }
                ]),
                { provide: AuthStore, useValue: auth }
            ]
        });
    });

    it('ingelogd: doorlaten', async () => {
        auth.user.set(testUser());
        await RouterTestingHarness.create('/people/p9');
        expect(TestBed.inject(Router).url).toBe('/people/p9');
        expect(auth.attemptedUrl).toBeNull();
    });

    it('niet ingelogd: naar login en de gevraagde url onthouden', async () => {
        vi.spyOn(console, 'error').mockReturnValue(undefined);
        await RouterTestingHarness.create('/people/p9');
        expect(TestBed.inject(Router).url).toBe('/users/login');
        expect(auth.attemptedUrl).toBe('/people/p9');
    });
});
