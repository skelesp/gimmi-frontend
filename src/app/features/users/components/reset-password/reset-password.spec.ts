import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { fakeResource } from 'src/app/core/api/resource.testing';

import { ApiProblem } from 'src/app/core/api/api-problem';
import { ProblemNotifier } from 'src/app/core/api/problem-notifier';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { Notifications } from 'src/app/core/notifications';
import { PasswordReset } from '../../service/password-reset';
import { ResetPassword } from './reset-password';

// Resetting the password with the link from the mail: /users/resetpassword/:token (sc-2004, sc-3286). The resource
// says whether the token is valid; then the user chooses a new password and is logged in right away.
describe('ResetPassword', () => {
    let fixture: ComponentFixture<ResetPassword>;
    let passwordReset: { get: ReturnType<typeof vi.fn>; complete: ReturnType<typeof vi.fn> };
    let link: ReturnType<typeof fakeResource>;
    let auth: ReturnType<typeof fakeAuthStore>;
    let problems: { show: ReturnType<typeof vi.fn> };
    let notifications: { showNotification: ReturnType<typeof vi.fn> };

    /** `info` null: the server says the link is unknown, used or expired (404). */
    async function open(info: object | null = { firstName: 'Ria', expiresAt: '2026-11-10T10:00:00Z' }) {
        link = fakeResource(info ?? undefined);
        if (info === null) link.error.set(new ApiProblem({ status: 404, code: 'not-found' }));
        passwordReset.get.mockReturnValue(link.ref);
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ token: 'abc123' })) } },
                { provide: PasswordReset, useValue: passwordReset },
                { provide: AuthStore, useValue: auth },
                { provide: ProblemNotifier, useValue: problems },
                { provide: Notifications, useValue: notifications }
            ]
        });
        fixture = TestBed.createComponent(ResetPassword);
        await fixture.whenStable();
    }

    function el(): HTMLElement { return fixture.nativeElement; }
    function button(): HTMLButtonElement { return el().querySelector('button[type="submit"]')!; }

    async function fillIn(password: string, repeated: string) {
        const inputs: HTMLInputElement[] = Array.from(el().querySelectorAll('input'));
        inputs[0].value = password;
        inputs[0].dispatchEvent(new Event('input'));
        inputs[1].value = repeated;
        inputs[1].dispatchEvent(new Event('input'));
        await fixture.whenStable();
    }

    async function submit() {
        button().click();
        await fixture.whenStable();
    }

    beforeEach(() => {
        passwordReset = { get: vi.fn().mockName('PasswordReset.get'), complete: vi.fn().mockName('PasswordReset.complete') };
        auth = fakeAuthStore();
        problems = { show: vi.fn() };
        notifications = { showNotification: vi.fn() };
    });

    it('invalid or expired link: explanation and a link to request again, no form', async () => {
        await open(null);
        expect(el().querySelector('ngb-alert')!.textContent).toContain('Uw link is ofwel vervallen (= ouder dan 1u) of ongeldig.');
        expect(el().querySelector('gimmi-forgot-password-link')).toBeTruthy();
        expect(el().querySelector('form')).toBeNull();
    });

    it('while the link is being checked: a spinner and nothing else yet', async () => {
        await open();
        link.loading.set(true);
        await fixture.whenStable();
        expect(el().querySelector('.spinner-border')).not.toBeNull();
        expect(el().querySelector('form')).toBeNull();
        expect(el().querySelector('ngb-alert')).toBeNull();
    });

    it('the link cannot be checked now (not a 404): a notice instead of "link vervallen"', async () => {
        await open(null);
        link.error.set(new ApiProblem({ status: 503, code: 'unavailable' }));
        await fixture.whenStable();
        expect(el().querySelector('ngb-alert')!.textContent).toContain('niet controleren');
        expect(el().querySelector('gimmi-forgot-password-link')).toBeNull();
    });

    it('valid link: form with two password fields, button only active when they match', async () => {
        await open();
        expect(el().querySelector('ngb-alert')).toBeNull();
        expect(el().querySelectorAll('input').length).toBe(2);
        expect(button().disabled).toBe(true);

        await fillIn('Nieuw-geheim-1', 'Iets-anders-1');
        expect(button().disabled).toBe(true);

        await fillIn('Nieuw-geheim-1', 'Nieuw-geheim-1');
        expect(button().disabled).toBe(false);
    });

    it('save: new password with the token from the link, notice and logged in right away', async () => {
        passwordReset.complete.mockReturnValue(of(testUser()));
        await open();
        await fillIn('Nieuw-geheim-1', 'Nieuw-geheim-1');
        await submit();
        expect(passwordReset.complete).toHaveBeenCalledWith('abc123', 'Nieuw-geheim-1');
        expect(notifications.showNotification).toHaveBeenCalledWith(expect.stringContaining('succesvol'), 'success', 'Wachtwoord aangepast');
        expect(auth.redirectAfterAuthentication).toHaveBeenCalled();
    });

    it('link expired in the meantime (404): notice and explanation instead of the form', async () => {
        passwordReset.complete.mockReturnValue(throwError(() => new ApiProblem({ status: 404, code: 'not-found' })));
        await open();
        await fillIn('Nieuw-geheim-1', 'Nieuw-geheim-1');
        await submit();
        expect(notifications.showNotification).toHaveBeenCalledWith(expect.stringContaining('gefaald'), 'error', 'Link vervallen');
        expect(el().querySelector('ngb-alert')).not.toBeNull();
        expect(el().querySelector('form')).toBeNull();
    });

    it('password too weak for the server: notice at the password', async () => {
        passwordReset.complete.mockReturnValue(throwError(() => new ApiProblem({ status: 422, code: 'password-too-weak' })));
        await open();
        await fillIn('Nieuw-geheim-1', 'Nieuw-geheim-1');
        await submit();
        expect(el().querySelector('#serverError')!.textContent).toContain('minstens 8 tekens');
        expect(auth.redirectAfterAuthentication).not.toHaveBeenCalled();
    });

    it('another problem: a notice via the ProblemNotifier', async () => {
        const problem = new ApiProblem({ status: 429, code: 'rate-limited' });
        passwordReset.complete.mockReturnValue(throwError(() => problem));
        await open();
        await fillIn('Nieuw-geheim-1', 'Nieuw-geheim-1');
        await submit();
        expect(problems.show).toHaveBeenCalledWith(problem);
    });

    it('a failure without problem document: a generic notice', async () => {
        vi.spyOn(console, 'error').mockReturnValue(undefined);
        passwordReset.complete.mockReturnValue(throwError(() => new Error('offline')));
        await open();
        await fillIn('Nieuw-geheim-1', 'Nieuw-geheim-1');
        await submit();
        expect(notifications.showNotification).toHaveBeenCalledWith(expect.stringContaining('lukt nu niet'), 'error');
    });
});
