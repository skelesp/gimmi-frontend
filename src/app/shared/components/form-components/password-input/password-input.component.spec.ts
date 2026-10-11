import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { PasswordInputComponent } from './password-input.component';

// sc-2226: wachtwoordveld, verplicht, met tonen/verbergen.
describe('PasswordInputComponent', () => {
  let fixture: ComponentFixture<PasswordInputComponent>;
  let component: PasswordInputComponent;
  let form: FormGroup;

  function input(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FontAwesomeModule],
      declarations: [PasswordInputComponent]
    }).compileComponents();

    form = new FormGroup({});
    fixture = TestBed.createComponent(PasswordInputComponent);
    component = fixture.componentInstance;
    component.parentFormGroup = form;
  });

  it('voegt een control "password" toe en maakt het verplicht (asynchroon)', fakeAsync(() => {
    fixture.detectChanges();
    expect(form.get('password')).toBeTruthy();
    flushMicrotasks();
    expect(form.get('password').errors).toEqual({ required: true });
  }));

  it('toont "verplicht" als het veld leeg is en aangeraakt werd', fakeAsync(() => {
    fixture.detectChanges();
    flushMicrotasks();
    input().dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#passwordErrors').textContent).toContain('Wachtwoord is een verplicht veld');
  }));

  it('ingevuld: geldig', fakeAsync(() => {
    fixture.detectChanges();
    flushMicrotasks();
    input().value = 'geheim';
    input().dispatchEvent(new Event('input'));
    expect(form.get('password').valid).toBeTrue();
  }));

  it('verbergt het wachtwoord standaard en toont het na een klik op het oog', () => {
    fixture.detectChanges();
    expect(input().type).toBe('password');
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    expect(component.showPassword).toBeTrue();
    expect(input().type).toBe('text');
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    expect(input().type).toBe('password');
  });

  it('neemt controlnaam, placeholder en label over', () => {
    component.controlName = 'pw';
    component.placeholder = 'Nieuw wachtwoord';
    component.label = 'Wachtwoord';
    fixture.detectChanges();
    expect(form.get('pw')).toBeTruthy();
    expect(input().placeholder).toBe('Nieuw wachtwoord');
    expect(fixture.nativeElement.querySelector('label').textContent).toBe('Wachtwoord');
  });
});
