import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';

import { Person } from 'src/app/people/models/person.model';
import { PeopleService } from 'src/app/people/service/people.service';
import { EmailInputComponent } from 'src/app/shared/components/form-components/email-input/email-input.component';
import { PasswordCheckComponent } from 'src/app/shared/components/form-components/password-check/password-check.component';
import { PasswordInputComponent } from 'src/app/shared/components/form-components/password-input/password-input.component';
import { BindQueryparamToInputDirective } from 'src/app/shared/directives/bind-queryparam-to-input.directive';
import { User } from '../../models/user.model';
import { UserService } from '../../service/user.service';
import { ForgotPasswordLinkComponent } from '../forgot-password-link/forgot-password-link.component';
import { RegisterComponent } from './register.component';

// sc-2006 (registratie), sc-828 (bestaande gebruiker), sc-2253 (verplichte velden).
describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let users: jasmine.SpyObj<UserService>;
  let people: jasmine.SpyObj<PeopleService>;

  function vulAllesIn() {
    const f = component.registrationForm;
    f.get('personData').setValue({ firstName: 'Ria', lastName: 'Receiver', birthday: '1990-05-17' });
    f.get('localAccountData.email').setValue('ria@gimmi.be');
    f.get('localAccountData.passwordGroup.password').setValue('geheim');
    f.get('localAccountData.passwordGroup.passwordCheck').setValue('geheim');
    fixture.detectChanges();
  }

  beforeEach(fakeAsync(() => {
    users = jasmine.createSpyObj<UserService>('UserService', ['register', 'showAuthenticationConfirmation', 'redirectAfterAuthentication']);
    people = jasmine.createSpyObj<PeopleService>('PeopleService', ['addPerson', 'findPersonByEmail']);
    people.findPersonByEmail.and.returnValue(throwError('404'));
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule, FontAwesomeModule, NgbAlertModule],
      declarations: [
        RegisterComponent, EmailInputComponent, PasswordInputComponent, PasswordCheckComponent,
        ForgotPasswordLinkComponent, BindQueryparamToInputDirective
      ],
      providers: [{ provide: UserService, useValue: users }, { provide: PeopleService, useValue: people }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA] // gimmi-facebook-login-button
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
  }));

  it('voornaam, familienaam en geboortedatum zijn verplicht, met melding na aanraken', () => {
    const personData = component.registrationForm.get('personData');
    expect(personData.valid).toBeFalse();
    personData.markAllAsTouched();
    fixture.detectChanges();
    const tekst = fixture.nativeElement.textContent;
    expect(tekst).toContain('Voornaam is een verplicht veld');
    expect(tekst).toContain('Familienaam is een verplicht veld');
    expect(tekst).toContain('Verjaardag is een verplicht veld');
  });

  it('registreerknop pas actief als alles ingevuld is', () => {
    const knop: HTMLButtonElement = fixture.nativeElement.querySelector('button[type=submit]');
    expect(knop.disabled).toBeTrue();
    vulAllesIn();
    expect(component.registrationForm.valid).toBeTrue();
    expect(knop.disabled).toBeFalse();
  });

  it('geslaagde registratie: stuurt de juiste gegevens, logt in en voegt de persoon toe', () => {
    users.register.and.returnValue(of(new User('u1', 'Receiver', 'Ria', 'ria@gimmi.be', 'local', 't', [])));
    vulAllesIn();
    component.register();
    expect(users.register).toHaveBeenCalledWith({
      firstname: 'Ria', lastname: 'Receiver', birthday: '1990-05-17', email: 'ria@gimmi.be', password: 'geheim'
    });
    expect(users.showAuthenticationConfirmation).toHaveBeenCalled();
    expect(users.redirectAfterAuthentication).toHaveBeenCalled();
    expect(people.addPerson).toHaveBeenCalledWith(jasmine.any(Person));
    expect(people.addPerson.calls.mostRecent().args[0].id).toBe('u1');
  });

  it('bestaand e-mailadres: melding met link om in te loggen', () => {
    spyOn(console, 'error');
    users.register.and.returnValue(throwError('Gimmi API returned code 500 with message "User already exists"'));
    vulAllesIn();
    component.register();
    fixture.detectChanges();
    expect(component.knownUser).toBeTrue();
    const melding: HTMLElement = fixture.nativeElement.querySelector('.alert-danger');
    expect(melding.hidden).toBeFalse();
    expect(melding.querySelector('a').getAttribute('href')).toBe('/users/login?e=ria@gimmi.be');
  });

  it('andere fout: geen melding over een bestaande gebruiker', () => {
    spyOn(console, 'error');
    users.register.and.returnValue(throwError('Gimmi API returned code 500 with message "kapot"'));
    vulAllesIn();
    component.register();
    expect(component.knownUser).toBeFalsy();
  });
});
