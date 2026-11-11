import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ApiProblem } from 'src/app/core/api/api-problem';
import { ProblemNotifier } from 'src/app/core/api/problem-notifier';
import { EmailFieldHarness } from 'src/app/shared/components/form-components/email-field/email-field.harness';
import { Notifications } from 'src/app/core/notifications';
import { PasswordReset } from '../../service/password-reset';
import { ForgotPassword } from './forgot-password';

// Wachtwoord vergeten: een link aanvragen (sc-2004, sc-3286).
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

    it('knop pas actief met een geldig e-mailadres', async () => {
        const knop: HTMLButtonElement = fixture.nativeElement.querySelector('button[type=submit]');
        expect(knop.disabled).toBe(true);
        const field = await TestbedHarnessEnvironment.loader(fixture).getHarness(EmailFieldHarness);
        await field.setValue('ria@gimmi.be');
        expect(knop.disabled).toBe(false);
    });

    it('aanvragen: vraagt de link aan en toont de bevestiging', async () => {
        passwordReset.request.mockReturnValue(of(undefined));
        await submitWith('ria@gimmi.be');
        expect(passwordReset.request).toHaveBeenCalledWith('ria@gimmi.be');
        expect(fixture.componentInstance.requestSent()).toBe(true);
        expect(fixture.nativeElement.querySelector('ngb-alert').textContent).toContain('paswoord reset werd aangevraagd');
    });

    it('een probleem van de API (te veel pogingen): een melding en geen bevestiging', async () => {
        const problem = new ApiProblem({ status: 429, code: 'rate-limited' });
        passwordReset.request.mockReturnValue(throwError(() => problem));
        await submitWith('ria@gimmi.be');
        expect(problems.show).toHaveBeenCalledWith(problem);
        expect(fixture.componentInstance.requestSent()).toBe(false);
    });

    it('een storing zonder probleemdocument: een algemene waarschuwing', async () => {
        vi.spyOn(console, 'error').mockReturnValue(undefined);
        passwordReset.request.mockReturnValue(throwError(() => new Error('offline')));
        await submitWith('ria@gimmi.be');
        expect(notifications.showNotification).toHaveBeenCalledWith(expect.stringContaining('Er ging iets fout'), 'warning');
    });
});
