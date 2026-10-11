import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { PasswordInputComponent } from '../password-input/password-input.component';
import { PasswordCheckComponent } from './password-check.component';

// sc-2226: twee wachtwoordvelden die moeten overeenkomen.
describe('PasswordCheckComponent', () => {
  let fixture: ComponentFixture<PasswordCheckComponent>;
  let form: FormGroup;

  function group(): FormGroup {
    return form.get('passwordGroup') as FormGroup;
  }

  function fill(password: string, check: string) {
    group().get('password').setValue(password);
    group().get('passwordCheck').setValue(check);
    group().markAsTouched();
    fixture.detectChanges();
  }

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FontAwesomeModule],
      declarations: [PasswordCheckComponent, PasswordInputComponent]
    }).compileComponents();

    form = new FormGroup({});
    fixture = TestBed.createComponent(PasswordCheckComponent);
    fixture.componentInstance.parentFormGroup = form;
    fixture.detectChanges();
    flushMicrotasks();
  }));

  it('maakt een groep met de velden password en passwordCheck', () => {
    expect(group().get('password')).toBeTruthy();
    expect(group().get('passwordCheck')).toBeTruthy();
  });

  it('verschillende wachtwoorden: fout en melding', () => {
    fill('geheim1', 'geheim2');
    expect(group().errors).toEqual({ noPasswordMatch: true });
    expect(fixture.nativeElement.textContent).toContain('De 2 wachtwoorden moeten overeenkomen');
  });

  it('gelijke wachtwoorden: geldig', () => {
    fill('geheim', 'geheim');
    expect(group().valid).toBeTrue();
    expect(fixture.nativeElement.textContent).not.toContain('moeten overeenkomen');
  });

  it('pas één veld ingevuld: geen fout over overeenkomen (wel verplicht)', () => {
    fill('geheim', null);
    expect(group().errors).toBeNull();
    expect(group().valid).toBeFalse();
  });
});
