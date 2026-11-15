import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ApiProblem } from '../../../../core/api/api-problem';
import { ProblemNotifier } from '../../../../core/api/problem-notifier';
import { Notifications } from '../../../../core/notifications';
import { EmailFieldHarness } from '../../../../shared/components/form-components/email-field/email-field.harness';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { People } from '../../service/people';
import { Invite } from './invite';

// Inviting someone who has no list yet: the server sends the mail (sc-3287).
describe('Invite', () => {
    let fixture: ComponentFixture<Invite>;
    let people: { invite: ReturnType<typeof vi.fn> };
    let problems: { show: ReturnType<typeof vi.fn> };
    let notifications: { showNotification: ReturnType<typeof vi.fn> };
    let email: EmailFieldHarness;

    const button = () => fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;

    async function submit(address: string) {
        await email.setValue(address);
        await email.blur();
        button().click();
        await fixture.whenStable();
    }

    beforeEach(async () => {
        people = { invite: vi.fn().mockName('People.invite').mockReturnValue(of(undefined)) };
        problems = { show: vi.fn().mockName('ProblemNotifier.show') };
        notifications = { showNotification: vi.fn().mockName('Notifications.showNotification') };
        await TestBed.configureTestingModule({
            imports: [Invite],
            providers: [
                { provide: People, useValue: people },
                { provide: ProblemNotifier, useValue: problems },
                { provide: Notifications, useValue: notifications }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(Invite);
        await fixture.whenStable();
        email = await TestbedHarnessEnvironment.harnessForFixture(fixture, EmailFieldHarness);
    });

    it('no longer has a "hou mij op de hoogte" checkbox', () => {
        expect(fixture.nativeElement.querySelector('input[type="checkbox"]')).toBeNull();
    });

    it('an invalid address: notice and no call', async () => {
        await submit('geen-adres');
        expect(await email.getErrorText()).toContain('Geef een geldig emailadres in');
        expect(button().disabled).toBe(true);
        expect(people.invite).not.toHaveBeenCalled();
    });

    it('a valid address: the server invites, success notice and the field is empty again', async () => {
        await submit('nieuw@gimmi.be');
        expect(people.invite).toHaveBeenCalledWith('nieuw@gimmi.be');
        expect(notifications.showNotification).toHaveBeenCalledWith('De uitnodiging werd verzonden.', 'success');
        expect(await email.getValue()).toBe('');
    });

    it('an error from the server (e.g. too many requests) is reported and leaves the address', async () => {
        const problem = new ApiProblem({ status: 429, code: 'rate-limited' as never });
        people.invite.mockReturnValue(throwError(() => problem));
        await submit('nieuw@gimmi.be');
        expect(problems.show).toHaveBeenCalledWith(problem);
        expect(await email.getValue()).toBe('nieuw@gimmi.be');
    });
});
