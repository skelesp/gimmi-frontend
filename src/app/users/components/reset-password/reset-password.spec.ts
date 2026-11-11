import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApiProblem } from 'src/app/core/api/api-problem';
import { ProblemNotifier } from 'src/app/core/api/problem-notifier';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { PasswordReset } from '../../service/password-reset';
import { ResetPassword } from './reset-password';

// Wachtwoord resetten met de link uit de mail: /users/resetpassword/:token (sc-2004, sc-3286). De resolver
// zegt of het token geldig is; daarna kiest de gebruiker een nieuw wachtwoord en is meteen ingelogd.
describe('ResetPassword', () => {
    let fixture: ComponentFixture<ResetPassword>;
    let passwordReset: { complete: ReturnType<typeof vi.fn> };
    let auth: ReturnType<typeof fakeAuthStore>;
    let problems: { show: ReturnType<typeof vi.fn> };
    let notifications: { showNotification: ReturnType<typeof vi.fn> };

    async function open(info: object | null = { firstName: 'Ria', expiresAt: '2026-11-10T10:00:00Z' }) {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ token: 'abc123' }), data: { passwordReset: info } } } },
                { provide: PasswordReset, useValue: passwordReset },
                { provide: AuthStore, useValue: auth },
                { provide: ProblemNotifier, useValue: problems },
                { provide: NotificationService, useValue: notifications }
            ]
        });
        fixture = TestBed.createComponent(ResetPassword);
        await fixture.whenStable();
    }

    function el(): HTMLElement { return fixture.nativeElement; }
    function knop(): HTMLButtonElement { return el().querySelector('button[type="submit"]')!; }

    async function vulIn(wachtwoord: string, herhaling: string) {
        const inputs: HTMLInputElement[] = Array.from(el().querySelectorAll('input'));
        inputs[0].value = wachtwoord;
        inputs[0].dispatchEvent(new Event('input'));
        inputs[1].value = herhaling;
        inputs[1].dispatchEvent(new Event('input'));
        await fixture.whenStable();
    }

    async function verstuur() {
        knop().click();
        await fixture.whenStable();
    }

    beforeEach(() => {
        passwordReset = { complete: vi.fn().mockName('PasswordReset.complete') };
        auth = fakeAuthStore();
        problems = { show: vi.fn() };
        notifications = { showNotification: vi.fn() };
    });

    it('ongeldige of vervallen link: uitleg en een link om opnieuw aan te vragen, geen formulier', async () => {
        await open(null);
        expect(el().querySelector('ngb-alert')!.textContent).toContain('Uw link is ofwel vervallen (= ouder dan 1u) of ongeldig.');
        expect(el().querySelector('gimmi-forgot-password-link')).toBeTruthy();
        expect(el().querySelector('form')).toBeNull();
    });

    it('geldige link: formulier met twee wachtwoordvelden, knop pas actief als ze overeenkomen', async () => {
        await open();
        expect(el().querySelector('ngb-alert')).toBeNull();
        expect(el().querySelectorAll('input').length).toBe(2);
        expect(knop().disabled).toBe(true);

        await vulIn('Nieuw-geheim-1', 'Iets-anders-1');
        expect(knop().disabled).toBe(true);

        await vulIn('Nieuw-geheim-1', 'Nieuw-geheim-1');
        expect(knop().disabled).toBe(false);
    });

    it('opslaan: nieuw wachtwoord met het token uit de link, melding en meteen ingelogd', async () => {
        passwordReset.complete.mockReturnValue(of(testUser()));
        await open();
        await vulIn('Nieuw-geheim-1', 'Nieuw-geheim-1');
        await verstuur();
        expect(passwordReset.complete).toHaveBeenCalledWith('abc123', 'Nieuw-geheim-1');
        expect(notifications.showNotification).toHaveBeenCalledWith(expect.stringContaining('succesvol'), 'success', 'Wachtwoord aangepast');
        expect(auth.redirectAfterAuthentication).toHaveBeenCalled();
    });

    it('link intussen verlopen (404): melding en uitleg in plaats van het formulier', async () => {
        passwordReset.complete.mockReturnValue(throwError(() => new ApiProblem({ status: 404, code: 'not-found' })));
        await open();
        await vulIn('Nieuw-geheim-1', 'Nieuw-geheim-1');
        await verstuur();
        expect(notifications.showNotification).toHaveBeenCalledWith(expect.stringContaining('gefaald'), 'error', 'Link vervallen');
        expect(el().querySelector('ngb-alert')).not.toBeNull();
        expect(el().querySelector('form')).toBeNull();
    });

    it('wachtwoord te zwak voor de server: melding bij het wachtwoord', async () => {
        passwordReset.complete.mockReturnValue(throwError(() => new ApiProblem({ status: 422, code: 'password-too-weak' })));
        await open();
        await vulIn('Nieuw-geheim-1', 'Nieuw-geheim-1');
        await verstuur();
        expect(el().querySelector('#serverError')!.textContent).toContain('minstens 8 tekens');
        expect(auth.redirectAfterAuthentication).not.toHaveBeenCalled();
    });

    it('een ander probleem: een melding via de ProblemNotifier', async () => {
        const problem = new ApiProblem({ status: 429, code: 'rate-limited' });
        passwordReset.complete.mockReturnValue(throwError(() => problem));
        await open();
        await vulIn('Nieuw-geheim-1', 'Nieuw-geheim-1');
        await verstuur();
        expect(problems.show).toHaveBeenCalledWith(problem);
    });

    it('een storing zonder probleemdocument: een algemene melding', async () => {
        vi.spyOn(console, 'error').mockReturnValue(undefined);
        passwordReset.complete.mockReturnValue(throwError(() => new Error('offline')));
        await open();
        await vulIn('Nieuw-geheim-1', 'Nieuw-geheim-1');
        await verstuur();
        expect(notifications.showNotification).toHaveBeenCalledWith(expect.stringContaining('lukt nu niet'), 'error');
    });
});
