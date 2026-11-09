import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormGroup } from '../dynamic-form-group';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { PasswordInputComponent } from './password-input.component';

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
    let form: DynamicFormGroup;

    function input(): HTMLInputElement {
        return fixture.nativeElement.querySelector('input');
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
        fixture.detectChanges();
        expect(form.get('password')).toBeTruthy();
        await vi.advanceTimersByTimeAsync(0);
        expect(form.get('password').errors).toEqual({ required: true });
    });

    it('toont "verplicht" als het veld leeg is en aangeraakt werd', async () => {
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(0);
        input().dispatchEvent(new Event('blur'));
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('#passwordErrors').textContent).toContain('Wachtwoord is een verplicht veld');
    });

    it('ingevuld: geldig', async () => {
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(0);
        input().value = 'geheim';
        input().dispatchEvent(new Event('input'));
        expect(form.get('password').valid).toBe(true);
    });

    it('verbergt het wachtwoord standaard en toont het na een klik op het oog', () => {
        fixture.detectChanges();
        expect(input().type).toBe('password');
        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();
        expect(component.showPassword).toBe(true);
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
