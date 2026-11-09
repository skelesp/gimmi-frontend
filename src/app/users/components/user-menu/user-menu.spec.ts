import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { User } from '../../models/user.model';
import { UserService } from '../../service/user.service';
import { UserMenu } from './user-menu';

// Menu van de ingelogde gebruiker in de navigatiebalk.
describe('UserMenu', () => {
    let fixture: ComponentFixture<UserMenu>;
    let currentUser$: BehaviorSubject<User>;
    const ilse = new User('u1', 'Ingelogd', 'Ilse', 'ilse@gimmi.be', 'local', 't', []);

    beforeEach(async () => {
        currentUser$ = new BehaviorSubject<User>(ilse);
        TestBed.overrideComponent(UserMenu, { add: { schemas: [NO_ERRORS_SCHEMA] } });
        await TestBed.configureTestingModule({
            imports: [UserMenu],
            providers: [
                provideRouter([]),
                { provide: UserService, useValue: { currentUser$: currentUser$.asObservable() } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(UserMenu);
        await fixture.whenStable();
    });

    it('toont de voornaam van de gebruiker', () => {
        expect(fixture.nativeElement.textContent).toContain('Ilse');
    });

    it('stopt met luisteren bij het verdwijnen van het menu', () => {
        fixture.destroy();
        expect(currentUser$.observers.length).toBe(0);
    });
});
