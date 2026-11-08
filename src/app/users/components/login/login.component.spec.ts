
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { environment } from 'src/environments/environment';
import { PeopleService } from 'src/app/people/service/people.service';
import { EmailInputComponent } from 'src/app/shared/components/form-components/email-input/email-input.component';
import { PasswordInputComponent } from 'src/app/shared/components/form-components/password-input/password-input.component';
import { BindQueryparamToInputDirective } from 'src/app/shared/directives/bind-queryparam-to-input.directive';
import { User } from '../../models/user.model';
import { UserService } from '../../service/user.service';
import { ForgotPasswordLinkComponent } from '../forgot-password-link/forgot-password-link.component';
import { LoginComponent } from './login.component';

// sc-1976 (login), sc-2198 (wachtwoord vergeten-link), sc-2041 (attemptedUrl).
describe('LoginComponent', () => {
    beforeEach(() => {
        vi.useFakeTimers({ advanceTimeDelta: 1, shouldAdvanceTime: true });
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    let fixture: ComponentFixture<LoginComponent>;
    let component: LoginComponent;
    let users: Record<string, any> & {
        currentUser$: BehaviorSubject<User>;
        attemptedUrl: string;
    };

    function vulIn(email: string, password: string) {
        component.loginForm.get('email').setValue(email);
        component.loginForm.get('password').setValue(password);
        component.loginForm.markAsTouched();
        fixture.detectChanges();
    }

    function tekst(): string {
        return fixture.nativeElement.textContent;
    }

    beforeEach(async () => {
        users = Object.assign({
            authenticate: vi.fn().mockName("UserService.authenticate"),
            showAuthenticationConfirmation: vi.fn().mockName("UserService.showAuthenticationConfirmation"),
            redirectAfterAuthentication: vi.fn().mockName("UserService.redirectAfterAuthentication")
        }, { currentUser$: new BehaviorSubject<User>(null), attemptedUrl: null as string });
        TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, RouterTestingModule, FontAwesomeModule],
            declarations: [LoginComponent, EmailInputComponent, PasswordInputComponent, ForgotPasswordLinkComponent, BindQueryparamToInputDirective],
            providers: [
                { provide: UserService, useValue: users },
                { provide: PeopleService, useValue: {
                        findPersonByEmail: vi.fn().mockName("PeopleService.findPersonByEmail")
                    } }
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        }).compileComponents();
        await vi.runOnlyPendingTimersAsync();
    });

    async function maak() {
        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(0);
        fixture.detectChanges();
    }

    it('loginknop uitgeschakeld tot het formulier geldig is', async () => {
        await maak();
        const knop: HTMLButtonElement = fixture.nativeElement.querySelector('button[type=submit]');
        expect(knop.disabled).toBe(true);
        vulIn('ria@gimmi.be', 'geheim');
        expect(knop.disabled).toBe(false);
    });

    it('geslaagde login: bevestiging, redirect en een leeg formulier', async () => {
        await maak();
        users.authenticate.mockReturnValue(of(new User('u1', 'R', 'Ria', 'ria@gimmi.be', 'local', 't', [])));
        vulIn('ria@gimmi.be', 'geheim');
        component.login();
        expect(users.authenticate).toHaveBeenCalledWith({ email: 'ria@gimmi.be', password: 'geheim' });
        expect(users.showAuthenticationConfirmation).toHaveBeenCalled();
        expect(users.redirectAfterAuthentication).toHaveBeenCalled();
        expect(component.loginForm.get('email').value).toBeNull();
        expect(component.authenticationError).toBe(false);
    });

    it('mislukte login: foutmelding met link "Wachtwoord vergeten?" met het e-mailadres', async () => {
        await maak();
        vi.spyOn(console, 'error').mockReturnValue(undefined);
        users.authenticate.mockReturnValue(throwError('401'));
        vulIn('ria@gimmi.be', 'mis');
        component.login();
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component.authenticationError).toBe(true);
        expect(tekst()).toContain('De combinatie emailadres / wachtwoord is niet correct');
        const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.alert-danger gimmi-forgot-password-link a');
        expect(link.getAttribute('href')).toBe('/users/forgotpassword?e=ria@gimmi.be');
    });

    it('al ingelogd: melding met de naam van de huidige gebruiker', async () => {
        users.currentUser$.next(new User('u1', 'Receiver', 'Ria', 'ria@gimmi.be', 'local', 't', []));
        await maak();
        expect(tekst()).toContain('Je bent al ingelogd momenteel als Ria Receiver');
    });

    it('attemptedUrl: toont waar de gebruiker na login heen gaat, en wist het bij verlaten', async () => {
        users.attemptedUrl = '/people/p9';
        await maak();
        expect(component.redirectUrl).toBe(environment.rootSiteUrl + '/people/p9');
        expect(tekst()).toContain('Je probeerde ' + environment.rootSiteUrl + '/people/p9 te bereiken');
        fixture.destroy();
        expect(users.attemptedUrl).toBeNull();
    });
});
