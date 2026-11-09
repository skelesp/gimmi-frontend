
import { provideRouter } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';

import { Person } from 'src/app/people/models/person.model';
import { PeopleService } from 'src/app/people/service/people.service';
import { EmailInput } from 'src/app/shared/components/form-components/email-input/email-input';
import { PasswordCheck } from 'src/app/shared/components/form-components/password-check/password-check';
import { PasswordInput } from 'src/app/shared/components/form-components/password-input/password-input';
import { BindQueryparamToInput } from 'src/app/shared/directives/bind-queryparam-to-input';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { UserService } from '../../service/user.service';
import { ForgotPasswordLink } from '../forgot-password-link/forgot-password-link';
import { Register } from './register';

// sc-2006 (registratie), sc-828 (bestaande gebruiker), sc-2253 (verplichte velden).
describe('Register', () => {
    beforeEach(() => {
        vi.useFakeTimers({ advanceTimeDelta: 1, shouldAdvanceTime: true });
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    let fixture: ComponentFixture<Register>;
    let component: Register;
    let users: Record<string, any>;
    let auth: ReturnType<typeof fakeAuthStore>;
    let people: Record<string, any>;

    async function vulAllesIn() {
        const f = component.registrationForm;
        f.get('personData').setValue({ firstName: 'Ria', lastName: 'Receiver', birthday: '1990-05-17' });
        f.get('localAccountData.email').setValue('ria@gimmi.be');
        f.get('localAccountData.passwordGroup.password').setValue('geheim');
        f.get('localAccountData.passwordGroup.passwordCheck').setValue('geheim');
        await fixture.whenStable();
    }

    beforeEach(async () => {
        users = {
            register: vi.fn().mockName("UserService.register")
        };
        auth = fakeAuthStore();
        people = {
            addPerson: vi.fn().mockName("PeopleService.addPerson"),
            findPersonByEmail: vi.fn().mockName("PeopleService.findPersonByEmail")
        };
        people.findPersonByEmail.mockReturnValue(throwError('404'));
        TestBed.configureTestingModule({
    imports: [ReactiveFormsModule, FontAwesomeModule, NgbAlertModule, Register, EmailInput, PasswordInput, PasswordCheck,
        ForgotPasswordLink, BindQueryparamToInput],
    providers: [provideRouter([]), { provide: UserService, useValue: users }, { provide: AuthStore, useValue: auth }, { provide: PeopleService, useValue: people }],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
}).compileComponents();

        fixture = TestBed.createComponent(Register);
        component = fixture.componentInstance;
        await fixture.whenStable();
        await vi.advanceTimersByTimeAsync(0);
        await fixture.whenStable();
        await vi.runOnlyPendingTimersAsync();
    });

    it('voornaam, familienaam en geboortedatum zijn verplicht, met melding na aanraken', async () => {
        const personData = component.registrationForm.get('personData');
        expect(personData.valid).toBe(false);
        personData.markAllAsTouched();
        await fixture.whenStable();
        const tekst = fixture.nativeElement.textContent;
        expect(tekst).toContain('Voornaam is een verplicht veld');
        expect(tekst).toContain('Familienaam is een verplicht veld');
        expect(tekst).toContain('Verjaardag is een verplicht veld');
    });

    it('registreerknop pas actief als alles ingevuld is', async () => {
        const knop: HTMLButtonElement = fixture.nativeElement.querySelector('button[type=submit]');
        expect(knop.disabled).toBe(true);
        await vulAllesIn();
        expect(component.registrationForm.valid).toBe(true);
        expect(knop.disabled).toBe(false);
    });

    it('geslaagde registratie: stuurt de juiste gegevens, logt in en voegt de persoon toe', async () => {
        users.register.mockReturnValue(of(testUser({ id: 'u1', firstName: 'Ria', lastName: 'Receiver', fullName: 'Ria Receiver', email: 'ria@gimmi.be' })));
        await vulAllesIn();
        component.register();
        expect(users.register).toHaveBeenCalledWith({
            firstname: 'Ria', lastname: 'Receiver', birthday: '1990-05-17', email: 'ria@gimmi.be', password: 'geheim'
        });
        expect(auth.showAuthenticationConfirmation).toHaveBeenCalled();
        expect(auth.redirectAfterAuthentication).toHaveBeenCalled();
        expect(people.addPerson).toHaveBeenCalledWith(expect.any(Person));
        expect(vi.mocked(people.addPerson).mock.lastCall[0].id).toBe('u1');
    });

    it('bestaand e-mailadres: melding met link om in te loggen', async () => {
        vi.spyOn(console, 'error').mockReturnValue(undefined);
        users.register.mockReturnValue(throwError('Gimmi API returned code 500 with message "User already exists"'));
        await vulAllesIn();
        component.register();
        await fixture.whenStable();
        expect(component.knownUser()).toBe(true);
        const melding: HTMLElement = fixture.nativeElement.querySelector('.alert-danger');
        expect(melding.hidden).toBe(false);
        expect(melding.querySelector('a').getAttribute('href')).toBe('/users/login?e=ria@gimmi.be');
    });

    it('andere fout: geen melding over een bestaande gebruiker', async () => {
        vi.spyOn(console, 'error').mockReturnValue(undefined);
        users.register.mockReturnValue(throwError('Gimmi API returned code 500 with message "kapot"'));
        await vulAllesIn();
        component.register();
        expect(component.knownUser()).toBeFalsy();
    });
});
