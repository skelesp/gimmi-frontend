import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormGroup } from '../dynamic-form-group';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { PasswordInputComponent } from './password-input.component';
import { PasswordInputHarness } from './password-input.component.harness';

// sc-2226: wachtwoordveld, verplicht, met tonen/verbergen.
describe('PasswordInputComponent', () => {
    beforeEach(() => {
        vi.useFakeTimers({ advanceTimeDelta: 1, shouldAdvanceTime: true });
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    let fixture: ComponentFixture<PasswordInputComponent>;
    let component: PasswordInputComponent;
    let harness: PasswordInputHarness;
    let form: DynamicFormGroup;

    // Creating the harness renders the component, so set plain (non-signal) properties first.
    async function render() {
        harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, PasswordInputHarness);
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
    imports: [ReactiveFormsModule, FontAwesomeModule, PasswordInputComponent]
}).compileComponents();

        form = new FormGroup({});
        fixture = TestBed.createComponent(PasswordInputComponent);
        component = fixture.componentInstance;
        component.parentFormGroup = form;
    });

    it('voegt een control "password" toe en maakt het verplicht (asynchroon)', async () => {
        await render();
        expect(form.get('password')).toBeTruthy();
        await vi.advanceTimersByTimeAsync(0);
        expect(form.get('password').errors).toEqual({ required: true });
    });

    it('toont "verplicht" als het veld leeg is en aangeraakt werd', async () => {
        await render();
        await vi.advanceTimersByTimeAsync(0);
        await harness.setValue('geheim');
        await harness.setValue('');
        await harness.blur();
        expect(await harness.getErrorText()).toContain('Wachtwoord is een verplicht veld');
    });

    it('ingevuld: geldig', async () => {
        await render();
        await vi.advanceTimersByTimeAsync(0);
        await harness.setValue('geheim');
        await harness.blur();
        expect(form.get('password').valid).toBe(true);
        expect(await harness.getErrorText()).toBe('');
    });

    it('verbergt het wachtwoord standaard en toont het na een klik op het oog', async () => {
        await render();
        expect(await harness.isPasswordVisible()).toBe(false);
        await harness.toggleVisibility();
        expect(await harness.isPasswordVisible()).toBe(true);
        await harness.toggleVisibility();
        expect(await harness.isPasswordVisible()).toBe(false);
    });

    it('neemt controlnaam, placeholder en label over', async () => {
        component.controlName = 'pw';
        component.placeholder = 'Nieuw wachtwoord';
        component.label = 'Wachtwoord';
        await render();
        expect(form.get('pw')).toBeTruthy();
        expect(await harness.getPlaceholder()).toBe('Nieuw wachtwoord');
        expect(await harness.getLabel()).toBe('Wachtwoord');
    });
});
