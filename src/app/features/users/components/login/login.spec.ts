import { provideRouter } from '@angular/router';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { environment } from 'src/environments/environment';
import { ApiProblem } from 'src/app/core/api/api-problem';
import { ProblemNotifier } from 'src/app/core/api/problem-notifier';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { EmailFieldHarness } from 'src/app/shared/components/form-components/email-field/email-field.harness';
import { PasswordFieldHarness } from 'src/app/shared/components/form-components/password-field/password-field.harness';
import { Notifications } from 'src/app/core/notifications';
import { Login } from './login';

// sc-1976 (login), sc-2198 (wachtwoord vergeten-link), sc-2041 (attemptedUrl), sc-3284 (API v2).
describe('Login', () => {
    let fixture: ComponentFixture<Login>;
    let auth: ReturnType<typeof fakeAuthStore>;
    let problems: { show: ReturnType<typeof vi.fn> };
    let notifications: { showNotification: ReturnType<typeof vi.fn> };

    async function fillIn(email: string, password: string) {
        const loader = TestbedHarnessEnvironment.loader(fixture);
        await (await loader.getHarness(EmailFieldHarness)).setValue(email);
        await (await loader.getHarness(PasswordFieldHarness)).setValue(password);
    }

    async function submit() {
        (fixture.nativeElement.querySelector('button[type=submit]') as HTMLButtonElement).click();
        await fixture.whenStable();
    }

    function text(): string {
        return fixture.nativeElement.textContent;
    }

    beforeEach(() => {
        auth = fakeAuthStore();
        problems = { show: vi.fn() };
        notifications = { showNotification: vi.fn() };
        TestBed.configureTestingModule({
            imports: [Login],
            providers: [
                provideRouter([]),
                { provide: AuthStore, useValue: auth },
                { provide: ProblemNotifier, useValue: problems },
                { provide: Notifications, useValue: notifications }
            ]
        });
    });

    async function create() {
        fixture = TestBed.createComponent(Login);
        await fixture.whenStable();
    }

    it('login button disabled until the form is valid', async () => {
        await create();
        const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type=submit]');
        expect(button.disabled).toBe(true);
        await fillIn('ria@gimmi.be', 'secret');
        expect(button.disabled).toBe(false);
    });

    it('shows a message for an invalid e-mail address', async () => {
        await create();
        const email = await TestbedHarnessEnvironment.loader(fixture).getHarness(EmailFieldHarness);
        await email.setValue('geen-adres');
        await email.blur();
        expect(await email.getErrorText()).toContain('Geef een geldig emailadres in');
    });

    it('successful login: logs in, welcomes, redirects and empties the form', async () => {
        auth.login.mockReturnValue(of(testUser()));
        await create();
        await fillIn('ria@gimmi.be', 'secret');
        await submit();
        expect(auth.login).toHaveBeenCalledWith('ria@gimmi.be', 'secret');
        expect(auth.showAuthenticationConfirmation).toHaveBeenCalled();
        expect(auth.redirectAfterAuthentication).toHaveBeenCalled();
        const email = await TestbedHarnessEnvironment.loader(fixture).getHarness(EmailFieldHarness);
        expect(await email.getValue()).toBe('');
        expect(fixture.componentInstance.authenticationError()).toBe(false);
    });

    it('wrong credentials: message with a "Wachtwoord vergeten?" link carrying the address', async () => {
        auth.login.mockReturnValue(throwError(() => new ApiProblem({ status: 401, code: 'invalid-credentials' })));
        await create();
        await fillIn('ria@gimmi.be', 'wrong');
        await submit();
        expect(fixture.componentInstance.authenticationError()).toBe(true);
        expect(text()).toContain('De combinatie emailadres / wachtwoord is niet correct');
        const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.alert-danger gimmi-forgot-password-link a');
        expect(link.getAttribute('href')).toBe('/users/forgotpassword?e=ria@gimmi.be');
        expect(auth.redirectAfterAuthentication).not.toHaveBeenCalled();
    });

    it('another problem (too many attempts): a toast, not the credentials message', async () => {
        const problem = new ApiProblem({ status: 429, code: 'rate-limited' });
        auth.login.mockReturnValue(throwError(() => problem));
        await create();
        await fillIn('ria@gimmi.be', 'secret');
        await submit();
        expect(problems.show).toHaveBeenCalledWith(problem);
        expect(fixture.componentInstance.authenticationError()).toBe(false);
    });

    it('a failure without a problem document (network): a general toast', async () => {
        vi.spyOn(console, 'error').mockReturnValue(undefined);
        auth.login.mockReturnValue(throwError(() => new Error('offline')));
        await create();
        await fillIn('ria@gimmi.be', 'secret');
        await submit();
        expect(notifications.showNotification).toHaveBeenCalledWith(expect.stringContaining('Inloggen lukt nu niet'), 'error');
    });

    it('already logged in: shows the name of the current user', async () => {
        auth.user.set(testUser({ firstName: 'Ria', lastName: 'Receiver' }));
        await create();
        expect(text()).toContain('Je bent al ingelogd momenteel als Ria Receiver');
    });

    it('attemptedUrl: shows where the person goes after logging in and forgets it when leaving', async () => {
        auth.attemptedUrl = '/people/p9';
        await create();
        expect(fixture.componentInstance.redirectUrl).toBe(environment.rootSiteUrl + '/people/p9');
        expect(text()).toContain('Je probeerde ' + environment.rootSiteUrl + '/people/p9 te bereiken');
        fixture.destroy();
        expect(auth.attemptedUrl).toBeNull();
    });
});
