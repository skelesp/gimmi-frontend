import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormGroup } from '../dynamic-form-group';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { PasswordInput } from '../password-input/password-input';
import { PasswordCheck } from './password-check';
import { PasswordCheckHarness } from './password-check.harness';

// sc-2226: twee wachtwoordvelden die moeten overeenkomen.
describe('PasswordCheck', () => {
    beforeEach(() => {
        vi.useFakeTimers({ advanceTimeDelta: 1, shouldAdvanceTime: true });
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    let fixture: ComponentFixture<PasswordCheck>;
    let form: DynamicFormGroup;
    let harness: PasswordCheckHarness;

    function group(): DynamicFormGroup {
        return form.get('passwordGroup') as DynamicFormGroup;
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
    imports: [ReactiveFormsModule, FontAwesomeModule, PasswordCheck, PasswordInput]
}).compileComponents();

        form = new FormGroup({});
        fixture = TestBed.createComponent(PasswordCheck);
        fixture.componentInstance.parentFormGroup = form;
        harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, PasswordCheckHarness);
        await vi.advanceTimersByTimeAsync(0);
        await vi.runOnlyPendingTimersAsync();
    });

    it('maakt een groep met de velden password en passwordCheck', () => {
        expect(group().get('password')).toBeTruthy();
        expect(group().get('passwordCheck')).toBeTruthy();
    });

    it('verschillende wachtwoorden: fout en melding', async () => {
        await harness.fill('geheim1', 'geheim2');
        expect(group().errors).toEqual({ noPasswordMatch: true });
        expect(await harness.getMismatchText()).toContain('De 2 wachtwoorden moeten overeenkomen');
    });

    it('gelijke wachtwoorden: geldig', async () => {
        await harness.fill('geheim', 'geheim');
        expect(group().valid).toBe(true);
        expect(await harness.getMismatchText()).toBe('');
    });

    it('pas één veld ingevuld: geen fout over overeenkomen (wel verplicht)', async () => {
        await harness.fill('geheim', '');
        expect(group().errors).toBeNull();
        expect(group().valid).toBe(false);
    });
});
