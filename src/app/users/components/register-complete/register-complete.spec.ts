import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApiProblem } from 'src/app/core/api/api-problem';
import { ProblemNotifier } from 'src/app/core/api/problem-notifier';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { Registration } from '../../service/registration';
import { RegisterComplete } from './register-complete';

// sc-3285: stap 2 van 2, de link uit de mail.
describe('RegisterComplete', () => {
    let fixture: ComponentFixture<RegisterComplete>;
    let registration: { complete: ReturnType<typeof vi.fn> };
    let auth: ReturnType<typeof fakeAuthStore>;
    let problems: { show: ReturnType<typeof vi.fn> };
    let notifications: { showNotification: ReturnType<typeof vi.fn> };

    function setInput(selector: string, value: string) {
        const input: HTMLInputElement = fixture.nativeElement.querySelector(selector);
        input.value = value;
        input.dispatchEvent(new Event('input'));
    }

    async function fillIn(password = 'geheim-genoeg') {
        setInput('#register-first-name', 'Ria');
        setInput('#register-last-name', 'Receiver');
        setInput('#register-birthday', '1990-05-17');
        const passwords: HTMLInputElement[] = Array.from(fixture.nativeElement.querySelectorAll('gimmi-password-field input'));
        passwords[0].value = password;
        passwords[0].dispatchEvent(new Event('input'));
        passwords[1].value = password;
        passwords[1].dispatchEvent(new Event('input'));
        await fixture.whenStable();
    }

    async function submit() {
        (fixture.nativeElement.querySelector('button[type=submit]') as HTMLButtonElement).click();
        await fixture.whenStable();
    }

    async function create(registrationInfo: object | null = { email: 'ria@gimmi.be', expiresAt: '2026-11-10T10:00:00Z' }) {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ token: 'tok1' }), data: { registration: registrationInfo } } } },
                { provide: Registration, useValue: registration },
                { provide: AuthStore, useValue: auth },
                { provide: ProblemNotifier, useValue: problems },
                { provide: NotificationService, useValue: notifications }
            ]
        });
        fixture = TestBed.createComponent(RegisterComplete);
        await fixture.whenStable();
    }

    beforeEach(() => {
        registration = { complete: vi.fn().mockName('Registration.complete') };
        auth = fakeAuthStore();
        problems = { show: vi.fn() };
        notifications = { showNotification: vi.fn() };
    });

    it('toont het bevestigde e-mailadres van de link', async () => {
        await create();
        expect(fixture.nativeElement.textContent).toContain('ria@gimmi.be');
    });

    it('onbekende of verlopen link: uitleg en een link om opnieuw aan te vragen, geen formulier', async () => {
        await create(null);
        expect(fixture.nativeElement.querySelector('#registrationExpired')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('#registrationExpired a').getAttribute('href')).toBe('/users/register');
        expect(fixture.nativeElement.querySelector('form')).toBeNull();
    });

    it('registreerknop pas actief als alles ingevuld is en de wachtwoorden overeenkomen', async () => {
        await create();
        const knop: HTMLButtonElement = fixture.nativeElement.querySelector('button[type=submit]');
        expect(knop.disabled).toBe(true);
        await fillIn();
        expect(knop.disabled).toBe(false);
        const check: HTMLInputElement = fixture.nativeElement.querySelectorAll('gimmi-password-field input')[1];
        check.value = 'iets-anders-1';
        check.dispatchEvent(new Event('input'));
        await fixture.whenStable();
        expect(knop.disabled).toBe(true);
    });

    it('geslaagde registratie: stuurt de gegevens met het token, voegt de persoon toe en gaat verder', async () => {
        const ria = testUser({ id: 'u1', firstName: 'Ria', lastName: 'Receiver' });
        registration.complete.mockReturnValue(of(ria));
        await create();
        await fillIn();
        await submit();
        expect(registration.complete).toHaveBeenCalledWith('tok1', {
            firstName: 'Ria', lastName: 'Receiver', birthday: '1990-05-17', password: 'geheim-genoeg'
        });
        expect(auth.showAuthenticationConfirmation).toHaveBeenCalled();
        expect(auth.redirectAfterAuthentication).toHaveBeenCalled();
    });

    it('email-taken: melding met een link naar het inloggen', async () => {
        registration.complete.mockReturnValue(throwError(() => new ApiProblem({ status: 409, code: 'email-taken' })));
        await create();
        await fillIn();
        await submit();
        const link: HTMLAnchorElement = fixture.nativeElement.querySelector('#emailTaken a');
        expect(link.getAttribute('href')).toBe('/users/login?e=ria@gimmi.be');
    });

    it('wachtwoord te zwak voor de server: melding bij het wachtwoord', async () => {
        registration.complete.mockReturnValue(throwError(() => new ApiProblem({ status: 422, code: 'password-too-weak' })));
        await create();
        await fillIn();
        await submit();
        expect(fixture.nativeElement.textContent).toContain('minstens 8 tekens');
    });

    it('validation met velden: de melding staat bij het veld', async () => {
        registration.complete.mockReturnValue(throwError(() => new ApiProblem({
            status: 400, code: 'validation', errors: [{ pointer: '/firstName', code: 'maxLength' }]
        } as never)));
        await create();
        await fillIn();
        await submit();
        expect(fixture.nativeElement.textContent).toContain('Deze waarde is te lang.');
    });

    it('404 bij het versturen: de link is intussen verlopen', async () => {
        registration.complete.mockReturnValue(throwError(() => new ApiProblem({ status: 404, code: 'not-found' })));
        await create();
        await fillIn();
        await submit();
        expect(fixture.nativeElement.querySelector('#registrationExpired')).not.toBeNull();
    });

    it('een ander probleem: een melding via de ProblemNotifier', async () => {
        const problem = new ApiProblem({ status: 503, code: 'unavailable' });
        registration.complete.mockReturnValue(throwError(() => problem));
        await create();
        await fillIn();
        await submit();
        expect(problems.show).toHaveBeenCalledWith(problem);
    });

    it('een storing zonder probleemdocument: een algemene melding', async () => {
        vi.spyOn(console, 'error').mockReturnValue(undefined);
        registration.complete.mockReturnValue(throwError(() => new Error('offline')));
        await create();
        await fillIn();
        await submit();
        expect(notifications.showNotification).toHaveBeenCalledWith(expect.stringContaining('Registreren lukt nu niet'), 'error');
    });
});
