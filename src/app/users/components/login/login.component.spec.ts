import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
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
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let users: jasmine.SpyObj<UserService> & { currentUser$: BehaviorSubject<User>; attemptedUrl: string };

  function vulIn(email: string, password: string) {
    component.loginForm.get('email').setValue(email);
    component.loginForm.get('password').setValue(password);
    component.loginForm.markAsTouched();
    fixture.detectChanges();
  }

  function tekst(): string {
    return fixture.nativeElement.textContent;
  }

  beforeEach(fakeAsync(() => {
    users = Object.assign(
      jasmine.createSpyObj<UserService>('UserService', ['authenticate', 'showAuthenticationConfirmation', 'redirectAfterAuthentication']),
      { currentUser$: new BehaviorSubject<User>(null), attemptedUrl: null as string }
    );
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule, FontAwesomeModule],
      declarations: [LoginComponent, EmailInputComponent, PasswordInputComponent, ForgotPasswordLinkComponent, BindQueryparamToInputDirective],
      providers: [
        { provide: UserService, useValue: users },
        { provide: PeopleService, useValue: jasmine.createSpyObj('PeopleService', ['findPersonByEmail']) }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA] // gimmi-facebook-login-button
    }).compileComponents();
  }));

  function maak() {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
  }

  it('loginknop uitgeschakeld tot het formulier geldig is', fakeAsync(() => {
    maak();
    const knop: HTMLButtonElement = fixture.nativeElement.querySelector('button[type=submit]');
    expect(knop.disabled).toBeTrue();
    vulIn('ria@gimmi.be', 'geheim');
    expect(knop.disabled).toBeFalse();
  }));

  it('geslaagde login: bevestiging, redirect en een leeg formulier', fakeAsync(() => {
    maak();
    users.authenticate.and.returnValue(of(new User('u1', 'R', 'Ria', 'ria@gimmi.be', 'local', 't', [])));
    vulIn('ria@gimmi.be', 'geheim');
    component.login();
    expect(users.authenticate).toHaveBeenCalledWith({ email: 'ria@gimmi.be', password: 'geheim' });
    expect(users.showAuthenticationConfirmation).toHaveBeenCalled();
    expect(users.redirectAfterAuthentication).toHaveBeenCalled();
    expect(component.loginForm.get('email').value).toBeNull();
    expect(component.authenticationError).toBeFalse();
  }));

  it('mislukte login: foutmelding met link "Wachtwoord vergeten?" met het e-mailadres', fakeAsync(() => {
    maak();
    spyOn(console, 'error');
    users.authenticate.and.returnValue(throwError('401'));
    vulIn('ria@gimmi.be', 'mis');
    component.login();
    fixture.detectChanges();
    expect(component.authenticationError).toBeTrue();
    expect(tekst()).toContain('De combinatie emailadres / wachtwoord is niet correct');
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.alert-danger gimmi-forgot-password-link a');
    expect(link.getAttribute('href')).toBe('/users/forgotpassword?e=ria@gimmi.be');
  }));

  it('al ingelogd: melding met de naam van de huidige gebruiker', fakeAsync(() => {
    users.currentUser$.next(new User('u1', 'Receiver', 'Ria', 'ria@gimmi.be', 'local', 't', []));
    maak();
    expect(tekst()).toContain('Je bent al ingelogd momenteel als Ria Receiver');
  }));

  it('attemptedUrl: toont waar de gebruiker na login heen gaat, en wist het bij verlaten', fakeAsync(() => {
    users.attemptedUrl = '/people/p9';
    maak();
    expect(component.redirectUrl).toBe(environment.rootSiteUrl + '/people/p9');
    expect(tekst()).toContain('Je probeerde ' + environment.rootSiteUrl + '/people/p9 te bereiken');
    fixture.destroy();
    expect(users.attemptedUrl).toBeNull();
  }));
});
