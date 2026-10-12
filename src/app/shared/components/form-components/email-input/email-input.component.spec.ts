import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { of, throwError } from 'rxjs';

import { Person } from 'src/app/people/models/person.model';
import { PeopleService } from 'src/app/people/service/people.service';
import { BindQueryparamToInputDirective } from 'src/app/shared/directives/bind-queryparam-to-input.directive';
import { EmailInputComponent } from './email-input.component';

// sc-2233 (e-mailinput met validaties), sc-2250 en sc-2178 (e-mail uit de query params).
describe('EmailInputComponent', () => {
  let fixture: ComponentFixture<EmailInputComponent>;
  let component: EmailInputComponent;
  let form: FormGroup;
  let people: jasmine.SpyObj<PeopleService>;

  function create(inputs: Partial<EmailInputComponent> = {}) {
    form = new FormGroup({});
    fixture = TestBed.createComponent(EmailInputComponent);
    component = fixture.componentInstance;
    component.parentFormGroup = form;
    Object.assign(component, inputs);
    fixture.detectChanges();
  }

  function input(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input');
  }

  function typeAndBlur(value: string) {
    input().value = value;
    input().dispatchEvent(new Event('input'));
    input().dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  function errorText(): string {
    return (fixture.nativeElement.querySelector('#emailError')?.textContent || '').trim();
  }

  beforeEach(async () => {
    people = jasmine.createSpyObj<PeopleService>('PeopleService', ['findPersonByEmail']);
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule, FontAwesomeModule],
      declarations: [EmailInputComponent, BindQueryparamToInputDirective],
      providers: [{ provide: PeopleService, useValue: people }]
    }).compileComponents();
  });

  it('voegt een control "email" toe aan het parent-formulier', () => {
    create();
    expect(form.get('email')).toBeTruthy();
    expect(input().placeholder).toBe('Email (login)');
  });

  it('gebruikt een andere controlnaam als die meegegeven wordt', () => {
    create({ controlName: 'adres' });
    expect(form.get('adres')).toBeTruthy();
  });

  it('leeg en aangeraakt: foutmelding "verplicht"', () => {
    create();
    typeAndBlur('');
    expect(form.valid).toBeFalse();
    expect(errorText()).toContain('Email is een verplicht veld');
  });

  it('ongeldig formaat: foutmelding over het formaat', () => {
    create();
    typeAndBlur('geen-email');
    expect(errorText()).toContain('Geef een geldig emailadres in');
  });

  it('geldig adres zonder bestaanscontrole: geen foutmelding', () => {
    create();
    typeAndBlur('iemand@gimmi.be');
    expect(form.valid).toBeTrue();
    expect(errorText()).toBe('');
    expect(people.findPersonByEmail).not.toHaveBeenCalled();
  });

  describe('met bestaanscontrole', () => {
    it('bekend adres: melding met een link naar de wensenlijst', () => {
      people.findPersonByEmail.and.returnValue(of(new Person('p1', 'Ria', 'Receiver')));
      create({ emailExistsValidation: true });
      typeAndBlur('ria@gimmi.be');
      expect(people.findPersonByEmail).toHaveBeenCalledWith('ria@gimmi.be');
      expect(form.get('email').errors).toEqual({ emailExists: true });
      expect(errorText()).toContain('Bekijk de wensen van Ria Receiver');
    });

    it('bekend adres met redirect naar login: link om in te loggen', () => {
      people.findPersonByEmail.and.returnValue(of(new Person('p1', 'Ria', 'Receiver')));
      create({ emailExistsValidation: true, emailExistsRedirectTo: 'login' });
      typeAndBlur('ria@gimmi.be');
      expect(errorText()).toContain('Login met dit emailadres');
    });

    it('onbekend adres: geldig', () => {
      people.findPersonByEmail.and.returnValue(throwError('404'));
      create({ emailExistsValidation: true });
      typeAndBlur('nieuw@gimmi.be');
      expect(form.get('email').valid).toBeTrue();
    });

    it('valideert pas bij blur, niet bij elke toetsaanslag', () => {
      people.findPersonByEmail.and.returnValue(throwError('404'));
      create({ emailExistsValidation: true });
      input().value = 'nieuw@gimmi.be';
      input().dispatchEvent(new Event('input'));
      expect(people.findPersonByEmail).not.toHaveBeenCalled();
    });
  });

  describe('e-mail uit de query params (bindedQueryParam)', () => {
    let oorspronkelijk: string;

    beforeEach(() => {
      oorspronkelijk = location.href;
    });

    afterEach(() => {
      history.replaceState(null, '', oorspronkelijk);
    });

    it('vult het veld in met de waarde van ?e=', fakeAsync(() => {
      history.replaceState(null, '', location.pathname + '?e=uit%40url.be');
      create({ bindedQueryParam: 'e' });
      tick();
      expect(form.get('email').value).toBe('uit@url.be');
    }));

    it('zonder die parameter blijft het veld leeg', fakeAsync(() => {
      history.replaceState(null, '', location.pathname);
      create({ bindedQueryParam: 'e' });
      tick();
      expect(form.get('email').value).toBeNull();
    }));
  });
});
