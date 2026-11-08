import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { User } from '../../models/user.model';
import { UserService } from '../../service/user.service';
import { UserMenuComponent } from './user-menu.component';

// Menu van de ingelogde gebruiker in de navigatiebalk.
describe('UserMenuComponent', () => {
    let fixture: ComponentFixture<UserMenuComponent>;
    let currentUser$: BehaviorSubject<User>;
    const ilse = new User('u1', 'Ingelogd', 'Ilse', 'ilse@gimmi.be', 'local', 't', {});

    beforeEach(async () => {
        currentUser$ = new BehaviorSubject<User>(ilse);
        TestBed.overrideComponent(UserMenuComponent, { add: { schemas: [NO_ERRORS_SCHEMA] } });
        await TestBed.configureTestingModule({
            imports: [UserMenuComponent],
            providers: [
                provideRouter([]),
                { provide: UserService, useValue: { currentUser$: currentUser$.asObservable() } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(UserMenuComponent);
        fixture.detectChanges();
    });

    it('toont de voornaam van de gebruiker', () => {
        expect(fixture.nativeElement.textContent).toContain('Ilse');
    });

    it('stopt met luisteren bij het verdwijnen van het menu', () => {
        fixture.destroy();
        expect(currentUser$.observers.length).toBe(0);
    });
});
