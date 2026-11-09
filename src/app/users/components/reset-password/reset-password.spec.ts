
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';

import { PasswordCheck } from 'src/app/shared/components/form-components/password-check/password-check';
import { PasswordCheckHarness } from 'src/app/shared/components/form-components/password-check/password-check.harness';
import { PasswordInput } from 'src/app/shared/components/form-components/password-input/password-input';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { UserService } from '../../service/user.service';
import { ResetPassword } from './reset-password';

// Wachtwoord resetten met de link uit de mail: /users/resetpassword/:token (sc-2004). De resolver
// zegt of het token geldig is; daarna kiest de gebruiker een nieuw wachtwoord en gaat naar login.
describe('ResetPassword', () => {
    beforeEach(() => {
        vi.useFakeTimers({ advanceTimeDelta: 1, shouldAdvanceTime: true });
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    let fixture: ComponentFixture<ResetPassword>;
    let users: Record<string, any>;
    let notifications: Record<string, any>;
    let router: Record<string, any>;

    async function open(validToken: boolean) {
        TestBed.overrideProvider(ActivatedRoute, {
            useValue: { data: of({ validToken }), snapshot: { paramMap: convertToParamMap({ token: 'abc123' }) } }
        });
        fixture = TestBed.createComponent(ResetPassword);
        await fixture.whenStable();
        await vi.advanceTimersByTimeAsync(0);
        await fixture.whenStable();
    }

    function el(): HTMLElement { return fixture.nativeElement; }

    async function vulIn(wachtwoord: string, herhaling: string) {
        const check = await TestbedHarnessEnvironment.loader(fixture).getHarness(PasswordCheckHarness);
        await check.fill(wachtwoord, herhaling);
    }

    function knop(): HTMLButtonElement { return el().querySelector('button[type="submit"]'); }

    beforeEach(async () => {
        users = {
            resetPassword: vi.fn().mockName("UserService.resetPassword")
        };
        notifications = {
            showNotification: vi.fn().mockName("NotificationService.showNotification")
        };
        router = {
            navigate: vi.fn().mockName("Router.navigate")
        };
        await TestBed.configureTestingModule({
    imports: [ReactiveFormsModule, FontAwesomeModule, NgbAlertModule, ResetPassword, PasswordCheck, PasswordInput],
    providers: [
        { provide: UserService, useValue: users },
        { provide: NotificationService, useValue: notifications },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: {} }
    ],
    schemas: [NO_ERRORS_SCHEMA]
}).compileComponents();
    });

    it('ongeldige of vervallen link: uitleg en een link om opnieuw aan te vragen, geen formulier', async () => {
        await open(false);
        expect(el().querySelector('ngb-alert').textContent).toContain('Uw link is ofwel vervallen (= ouder dan 1u) of ongeldig.');
        expect(el().querySelector('gimmi-forgot-password-link')).toBeTruthy();
        expect(el().querySelector('form')).toBeNull();
    });

    it('geldige link: formulier met twee wachtwoordvelden, knop pas actief als ze overeenkomen', async () => {
        await open(true);
        expect(el().querySelector('ngb-alert')).toBeNull();
        expect(el().querySelectorAll('input').length).toBe(2);
        expect(knop().disabled).toBe(true);

        await vulIn('Nieuw-geheim-1', 'Iets-anders-1');
        expect(knop().disabled).toBe(true);

        await vulIn('Nieuw-geheim-1', 'Nieuw-geheim-1');
        expect(knop().disabled).toBe(false);
    });

    it('opslaan: nieuw wachtwoord met het token uit de link, melding en naar login met het e-mailadres', async () => {
        users.resetPassword.mockReturnValue(of({ email: 'ria@gimmi.be', usedToken: 'abc123' }));
        await open(true);
        await vulIn('Nieuw-geheim-1', 'Nieuw-geheim-1');
        knop().click();

        expect(users.resetPassword).toHaveBeenCalledWith('Nieuw-geheim-1', 'abc123');
        expect(notifications.showNotification).toHaveBeenCalledWith('Wachtwoord reset is succesvol uitgevoerd. Je kan nu opnieuw inloggen.', 'success', 'Wachtwoord aangepast');
        expect(router.navigate).toHaveBeenCalledWith(['/users/login'], { queryParams: { e: 'ria@gimmi.be' } });
    });

    it('token intussen vervallen: foutmelding en de uitleg in plaats van het formulier', async () => {
        users.resetPassword.mockReturnValue(throwError({ status: 404 }));
        await open(true);
        await vulIn('Nieuw-geheim-1', 'Nieuw-geheim-1');
        knop().click();
        await fixture.whenStable();

        expect(notifications.showNotification).toHaveBeenCalledWith('Wachtwoord reset is gefaald. Vermoedelijk is de link vervallen. Vraag een nieuwe link aan.', 'error', 'Link vervallen');
        expect(router.navigate).not.toHaveBeenCalled();
        expect(el().querySelector('form')).toBeNull();
        expect(el().querySelector('ngb-alert')).toBeTruthy();
    });
});
