import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ApiProblem } from 'src/app/core/api/api-problem';
import { ProblemNotifier } from 'src/app/core/api/problem-notifier';
import { EmailFieldHarness } from 'src/app/shared/components/form-components/email-field/email-field.harness';
import { Notifications } from 'src/app/core/notifications';
import { PasswordReset } from '../../service/password-reset';
import { ForgotPassword } from './forgot-password';

// Forgotten password: requesting a link (sc-2004, sc-3286).
describe('ForgotPassword', () => {
    let fixture: ComponentFixture<ForgotPassword>;
    let passwordReset: { request: ReturnType<typeof vi.fn> };
    let problems: { show: ReturnType<typeof vi.fn> };
    let notifications: { showNotification: ReturnType<typeof vi.fn> };

    async function submitWith(email: string) {
        const field = await TestbedHarnessEnvironment.loader(fixture).getHarness(EmailFieldHarness);
        await field.setValue(email);
        (fixture.nativeElement.querySelector('button[type=submit]') as HTMLButtonElement).click();
        await fixture.whenStable();
    }

    beforeEach(async () => {
        passwordReset = { request: vi.fn().mockName('PasswordReset.request') };
        problems = { show: vi.fn() };
        notifications = { showNotification: vi.fn() };
        TestBed.configureTestingModule({
            imports: [ForgotPassword],
            providers: [
                { provide: PasswordReset, useValue: passwordReset },
                { provide: ProblemNotifier, useValue: problems },
                { provide: Notifications, useValue: notifications }
            ]
        });
        fixture = TestBed.createComponent(ForgotPassword);
        await fixture.whenStable();
    });

    it('button only active with a valid email address', async () => {
        const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type=submit]');
        expect(button.disabled).toBe(true);
        const field = await TestbedHarnessEnvironment.loader(fixture).getHarness(EmailFieldHarness);
        await field.setValue('ria@gimmi.be');
        expect(button.disabled).toBe(false);
    });

    it('request: requests the link and shows the confirmation', async () => {
        passwordReset.request.mockReturnValue(of(undefined));
        await submitWith('ria@gimmi.be');
        expect(passwordReset.request).toHaveBeenCalledWith('ria@gimmi.be');
        expect(fixture.componentInstance.requestSent()).toBe(true);
        expect(fixture.nativeElement.querySelector('ngb-alert').textContent).toContain('paswoord reset werd aangevraagd');
    });

    it('a problem from the API (too many attempts): a notice and no confirmation', async () => {
        const problem = new ApiProblem({ status: 429, code: 'rate-limited' });
        passwordReset.request.mockReturnValue(throwError(() => problem));
        await submitWith('ria@gimmi.be');
        expect(problems.show).toHaveBeenCalledWith(problem);
        expect(fixture.componentInstance.requestSent()).toBe(false);
    });

    it('a failure without problem document: a generic warning', async () => {
        vi.spyOn(console, 'error').mockReturnValue(undefined);
        passwordReset.request.mockReturnValue(throwError(() => new Error('offline')));
        await submitWith('ria@gimmi.be');
        expect(notifications.showNotification).toHaveBeenCalledWith(expect.stringContaining('Er ging iets fout'), 'warning');
    });
});
