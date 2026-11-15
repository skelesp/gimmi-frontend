import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ApiProblem } from 'src/app/core/api/api-problem';
import { ProblemNotifier } from 'src/app/core/api/problem-notifier';
import { EmailFieldHarness } from 'src/app/shared/components/form-components/email-field/email-field.harness';
import { Notifications } from 'src/app/core/notifications';
import { Registration } from '../../service/registration';
import { Register } from './register';

// sc-2006 (registration), sc-3285 (step 1 of 2: confirming the email address).
describe('Register', () => {
    let fixture: ComponentFixture<Register>;
    let registration: { start: ReturnType<typeof vi.fn> };
    let problems: { show: ReturnType<typeof vi.fn> };
    let notifications: { showNotification: ReturnType<typeof vi.fn> };

    async function submitWith(email: string) {
        const field = await TestbedHarnessEnvironment.loader(fixture).getHarness(EmailFieldHarness);
        await field.setValue(email);
        (fixture.nativeElement.querySelector('button[type=submit]') as HTMLButtonElement).click();
        await fixture.whenStable();
    }

    beforeEach(async () => {
        registration = { start: vi.fn().mockName('Registration.start') };
        problems = { show: vi.fn() };
        notifications = { showNotification: vi.fn() };
        TestBed.configureTestingModule({
            imports: [Register],
            providers: [
                { provide: Registration, useValue: registration },
                { provide: ProblemNotifier, useValue: problems },
                { provide: Notifications, useValue: notifications }
            ]
        });
        fixture = TestBed.createComponent(Register);
        await fixture.whenStable();
    });

    it('register button only active with a valid email address', async () => {
        const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type=submit]');
        expect(button.disabled).toBe(true);
        const field = await TestbedHarnessEnvironment.loader(fixture).getHarness(EmailFieldHarness);
        await field.setValue('ria@gimmi.be');
        expect(button.disabled).toBe(false);
    });

    it('successful request: requests the mail and shows "controleer je mail" instead of the form', async () => {
        registration.start.mockReturnValue(of(undefined));
        await submitWith('ria@gimmi.be');
        expect(registration.start).toHaveBeenCalledWith('ria@gimmi.be');
        expect(fixture.nativeElement.querySelector('#registrationSent').textContent).toContain('ria@gimmi.be');
        expect(fixture.nativeElement.querySelector('form')).toBeNull();
    });

    it('a problem from the API (too many attempts): a notice, the form stays', async () => {
        const problem = new ApiProblem({ status: 429, code: 'rate-limited' });
        registration.start.mockReturnValue(throwError(() => problem));
        await submitWith('ria@gimmi.be');
        expect(problems.show).toHaveBeenCalledWith(problem);
        expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
        expect(fixture.componentInstance.sentTo()).toBeNull();
    });

    it('a failure without problem document: a generic notice', async () => {
        vi.spyOn(console, 'error').mockReturnValue(undefined);
        registration.start.mockReturnValue(throwError(() => new Error('offline')));
        await submitWith('ria@gimmi.be');
        expect(notifications.showNotification).toHaveBeenCalledWith(expect.stringContaining('Registreren lukt nu niet'), 'error');
    });
});
