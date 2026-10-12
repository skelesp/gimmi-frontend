import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';

import { PasswordCheckComponent } from 'src/app/shared/components/form-components/password-check/password-check.component';
import { PasswordInputComponent } from 'src/app/shared/components/form-components/password-input/password-input.component';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { UserService } from '../../service/user.service';
import { ResetPasswordComponent } from './reset-password.component';

// Wachtwoord resetten met de link uit de mail: /users/resetpassword/:token (sc-2004). De resolver
// zegt of het token geldig is; daarna kiest de gebruiker een nieuw wachtwoord en gaat naar login.
describe('ResetPasswordComponent', () => {
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let users: jasmine.SpyObj<UserService>;
  let notifications: jasmine.SpyObj<NotificationService>;
  let router: jasmine.SpyObj<Router>;

  function open(validToken: boolean) {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { data: of({ validToken }), snapshot: { paramMap: convertToParamMap({ token: 'abc123' }) } }
    });
    fixture = TestBed.createComponent(ResetPasswordComponent);
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
  }

  function el(): HTMLElement { return fixture.nativeElement; }

  function vulIn(wachtwoord: string, herhaling: string) {
    const [pw, check] = Array.from(el().querySelectorAll('input')) as HTMLInputElement[];
    for (const [input, waarde] of [[pw, wachtwoord], [check, herhaling]] as [HTMLInputElement, string][]) {
      input.value = waarde;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
    }
    fixture.detectChanges();
  }

  function knop(): HTMLButtonElement { return el().querySelector('button[type="submit"]'); }

  beforeEach(async () => {
    users = jasmine.createSpyObj<UserService>('UserService', ['resetPassword']);
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['showNotification']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FontAwesomeModule, NgbAlertModule],
      declarations: [ResetPasswordComponent, PasswordCheckComponent, PasswordInputComponent],
      providers: [
        { provide: UserService, useValue: users },
        { provide: NotificationService, useValue: notifications },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: {} }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('ongeldige of vervallen link: uitleg en een link om opnieuw aan te vragen, geen formulier', fakeAsync(() => {
    open(false);
    expect(el().querySelector('ngb-alert').textContent).toContain('Uw link is ofwel vervallen (= ouder dan 1u) of ongeldig.');
    expect(el().querySelector('gimmi-forgot-password-link')).toBeTruthy();
    expect(el().querySelector('form')).toBeNull();
  }));

  it('geldige link: formulier met twee wachtwoordvelden, knop pas actief als ze overeenkomen', fakeAsync(() => {
    open(true);
    expect(el().querySelector('ngb-alert')).toBeNull();
    expect(el().querySelectorAll('input').length).toBe(2);
    expect(knop().disabled).toBeTrue();

    vulIn('Nieuw-geheim-1', 'Iets-anders-1');
    expect(knop().disabled).toBeTrue();

    vulIn('Nieuw-geheim-1', 'Nieuw-geheim-1');
    expect(knop().disabled).toBeFalse();
  }));

  it('opslaan: nieuw wachtwoord met het token uit de link, melding en naar login met het e-mailadres', fakeAsync(() => {
    users.resetPassword.and.returnValue(of({ email: 'ria@gimmi.be', usedToken: 'abc123' }));
    open(true);
    vulIn('Nieuw-geheim-1', 'Nieuw-geheim-1');
    knop().click();

    expect(users.resetPassword).toHaveBeenCalledWith('Nieuw-geheim-1', 'abc123');
    expect(notifications.showNotification).toHaveBeenCalledWith(
      'Wachtwoord reset is succesvol uitgevoerd. Je kan nu opnieuw inloggen.', 'success', 'Wachtwoord aangepast');
    expect(router.navigate).toHaveBeenCalledWith(['/users/login'], { queryParams: { e: 'ria@gimmi.be' } });
  }));

  it('token intussen vervallen: foutmelding en de uitleg in plaats van het formulier', fakeAsync(() => {
    users.resetPassword.and.returnValue(throwError({ status: 404 }));
    open(true);
    vulIn('Nieuw-geheim-1', 'Nieuw-geheim-1');
    knop().click();
    fixture.detectChanges();

    expect(notifications.showNotification).toHaveBeenCalledWith(
      'Wachtwoord reset is gefaald. Vermoedelijk is de link vervallen. Vraag een nieuwe link aan.', 'error', 'Link vervallen');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(el().querySelector('form')).toBeNull();
    expect(el().querySelector('ngb-alert')).toBeTruthy();
  }));
});
