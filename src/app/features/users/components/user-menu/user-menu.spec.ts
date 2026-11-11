import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { UserMenu } from './user-menu';

// Menu van de ingelogde gebruiker in de navigatiebalk.
describe('UserMenu', () => {
    let fixture: ComponentFixture<UserMenu>;
    let auth: ReturnType<typeof fakeAuthStore>;
    const ilse = testUser({ id: 'u1', firstName: 'Ilse', lastName: 'Ingelogd', fullName: 'Ilse Ingelogd', email: 'ilse@gimmi.be' });

    beforeEach(async () => {
        auth = fakeAuthStore(ilse);
        TestBed.overrideComponent(UserMenu, { add: { schemas: [NO_ERRORS_SCHEMA] } });
        await TestBed.configureTestingModule({
            imports: [UserMenu],
            providers: [
                provideRouter([]),
                { provide: AuthStore, useValue: auth }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(UserMenu);
        await fixture.whenStable();
    });

    it('toont de voornaam van de gebruiker', () => {
        expect(fixture.nativeElement.textContent).toContain('Ilse');
    });

});
