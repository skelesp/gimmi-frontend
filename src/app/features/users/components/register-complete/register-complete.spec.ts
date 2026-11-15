import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { fakeResource } from 'src/app/core/api/resource.testing';

import { ApiProblem } from 'src/app/core/api/api-problem';
import { ProblemNotifier } from 'src/app/core/api/problem-notifier';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { Notifications } from 'src/app/core/notifications';
import { Registration } from '../../service/registration';
import { RegisterComplete } from './register-complete';

// sc-3285: step 2 of 2, the link from the mail.
describe('RegisterComplete', () => {
    let fixture: ComponentFixture<RegisterComplete>;
    let registration: { get: ReturnType<typeof vi.fn>; complete: ReturnType<typeof vi.fn> };
    let link: ReturnType<typeof fakeResource>;
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

    /** `info` null: the server says the link is unknown, used or expired (404). */
    async function create(info: object | null = { email: 'ria@gimmi.be', expiresAt: '2026-11-10T10:00:00Z' }) {
        link = fakeResource(info ?? undefined);
        if (info === null) link.error.set(new ApiProblem({ status: 404, code: 'not-found' }));
        registration.get.mockReturnValue(link.ref);
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ token: 'tok1' })) } },
                { provide: Registration, useValue: registration },
                { provide: AuthStore, useValue: auth },
                { provide: ProblemNotifier, useValue: problems },
                { provide: Notifications, useValue: notifications }
            ]
        });
        fixture = TestBed.createComponent(RegisterComplete);
        await fixture.whenStable();
    }

    beforeEach(() => {
        registration = { get: vi.fn().mockName('Registration.get'), complete: vi.fn().mockName('Registration.complete') };
        auth = fakeAuthStore();
        problems = { show: vi.fn() };
        notifications = { showNotification: vi.fn() };
    });

    it('shows the confirmed email address of the link', async () => {
        await create();
        expect(fixture.nativeElement.textContent).toContain('ria@gimmi.be');
    });

    it('unknown or expired link: explanation and a link to request again, no form', async () => {
        await create(null);
        expect(fixture.nativeElement.querySelector('#registrationExpired')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('#registrationExpired a').getAttribute('href')).toBe('/users/register');
        expect(fixture.nativeElement.querySelector('form')).toBeNull();
    });

    it('requests the data of the token from the route', async () => {
        await create();
        const token = registration.get.mock.calls[0][0] as () => string;
        expect(token()).toBe('tok1');
    });

    it('while the link is being checked: a spinner, no form and no notice', async () => {
        await create();
        link.loading.set(true);
        await fixture.whenStable();
        expect(fixture.nativeElement.querySelector('.spinner-border')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('form')).toBeNull();
        expect(fixture.nativeElement.querySelector('#registrationExpired')).toBeNull();
    });

    it('the link cannot be checked now (not a 404): a notice instead of "link verlopen"', async () => {
        await create(null);
        link.error.set(new ApiProblem({ status: 503, code: 'unavailable' }));
        await fixture.whenStable();
        expect(fixture.nativeElement.querySelector('#registrationCheckFailed')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('#registrationExpired')).toBeNull();
    });

    it('register button only active when everything is filled in and the passwords match', async () => {
        await create();
        const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type=submit]');
        expect(button.disabled).toBe(true);
        await fillIn();
        expect(button.disabled).toBe(false);
        const check: HTMLInputElement = fixture.nativeElement.querySelectorAll('gimmi-password-field input')[1];
        check.value = 'iets-anders-1';
        check.dispatchEvent(new Event('input'));
        await fixture.whenStable();
        expect(button.disabled).toBe(true);
    });

    it('successful registration: sends the data with the token, adds the person and continues', async () => {
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

    it('email-taken: notice with a link to logging in', async () => {
        registration.complete.mockReturnValue(throwError(() => new ApiProblem({ status: 409, code: 'email-taken' })));
        await create();
        await fillIn();
        await submit();
        const link: HTMLAnchorElement = fixture.nativeElement.querySelector('#emailTaken a');
        expect(link.getAttribute('href')).toBe('/users/login?e=ria@gimmi.be');
    });

    it('password too weak for the server: notice at the password', async () => {
        registration.complete.mockReturnValue(throwError(() => new ApiProblem({ status: 422, code: 'password-too-weak' })));
        await create();
        await fillIn();
        await submit();
        expect(fixture.nativeElement.textContent).toContain('minstens 8 tekens');
    });

    it('validation with fields: the notice is at the field', async () => {
        registration.complete.mockReturnValue(throwError(() => new ApiProblem({
            status: 400, code: 'validation', errors: [{ pointer: '/firstName', code: 'maxLength' }]
        } as never)));
        await create();
        await fillIn();
        await submit();
        expect(fixture.nativeElement.textContent).toContain('Deze waarde is te lang.');
    });

    it('404 when sending: the link has expired in the meantime', async () => {
        registration.complete.mockReturnValue(throwError(() => new ApiProblem({ status: 404, code: 'not-found' })));
        await create();
        await fillIn();
        await submit();
        expect(fixture.nativeElement.querySelector('#registrationExpired')).not.toBeNull();
    });

    it('another problem: a notice via the ProblemNotifier', async () => {
        const problem = new ApiProblem({ status: 503, code: 'unavailable' });
        registration.complete.mockReturnValue(throwError(() => problem));
        await create();
        await fillIn();
        await submit();
        expect(problems.show).toHaveBeenCalledWith(problem);
    });

    it('a failure without problem document: a generic notice', async () => {
        vi.spyOn(console, 'error').mockReturnValue(undefined);
        registration.complete.mockReturnValue(throwError(() => new Error('offline')));
        await create();
        await fillIn();
        await submit();
        expect(notifications.showNotification).toHaveBeenCalledWith(expect.stringContaining('Registreren lukt nu niet'), 'error');
    });
});
