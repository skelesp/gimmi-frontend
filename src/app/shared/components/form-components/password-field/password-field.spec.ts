import { Component, signal } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, required } from '@angular/forms/signals';

import { PasswordField } from './password-field';
import { PasswordFieldHarness } from './password-field.harness';

@Component({
  imports: [PasswordField],
  template: '<gimmi-password-field [field]="loginForm.password" label="Wachtwoord" />'
})
class Host {
  readonly model = signal({ password: '' });
  readonly loginForm = form(this.model, path => required(path.password, { message: 'Wachtwoord is een verplicht veld.' }));
}

describe('PasswordField', () => {
  let fixture: ComponentFixture<Host>;
  let field: PasswordFieldHarness;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    field = await TestbedHarnessEnvironment.loader(fixture).getHarness(PasswordFieldHarness);
  });

  it('shows the label and the placeholder', async () => {
    expect(await field.getLabel()).toBe('Wachtwoord');
    expect(await field.getPlaceholder()).toBe('Wachtwoord');
  });

  it('writes what is typed to the model', async () => {
    await field.setValue('geheim');
    expect(fixture.componentInstance.model().password).toBe('geheim');
    expect(await field.getValue()).toBe('geheim');
  });

  it('hides the password until the eye button is pressed', async () => {
    expect(await field.isPasswordVisible()).toBe(false);
    await field.toggleVisibility();
    expect(await field.isPasswordVisible()).toBe(true);
    await field.toggleVisibility();
    expect(await field.isPasswordVisible()).toBe(false);
  });

  it('shows the message of the error once the field was touched', async () => {
    expect(await field.getErrorText()).toBe('');
    await field.blur();
    expect(await field.getErrorText()).toBe('Wachtwoord is een verplicht veld.');
  });
});
