import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormGroup, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { PasswordInputComponent } from '../password-input/password-input.component';
import { PasswordCheckComponent } from './password-check.component';

// sc-2226: twee wachtwoordvelden die moeten overeenkomen.
describe('PasswordCheckComponent', () => {
    beforeEach(() => {
        vi.useFakeTimers({ advanceTimeDelta: 1, shouldAdvanceTime: true });
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    let fixture: ComponentFixture<PasswordCheckComponent>;
    let form: UntypedFormGroup;

    function group(): UntypedFormGroup {
        return form.get('passwordGroup') as UntypedFormGroup;
    }

    function fill(password: string, check: string) {
        group().get('password').setValue(password);
        group().get('passwordCheck').setValue(check);
        group().markAsTouched();
        fixture.detectChanges();
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
    imports: [ReactiveFormsModule, FontAwesomeModule, PasswordCheckComponent, PasswordInputComponent]
}).compileComponents();

        form = new UntypedFormGroup({});
        fixture = TestBed.createComponent(PasswordCheckComponent);
        fixture.componentInstance.parentFormGroup = form;
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(0);
        await vi.runOnlyPendingTimersAsync();
    });

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
        expect(group().valid).toBe(true);
        expect(fixture.nativeElement.textContent).not.toContain('moeten overeenkomen');
    });

    it('pas één veld ingevuld: geen fout over overeenkomen (wel verplicht)', () => {
        fill('geheim', null);
        expect(group().errors).toBeNull();
        expect(group().valid).toBe(false);
    });
});
