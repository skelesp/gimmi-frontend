
import { provideRouter } from '@angular/router';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormGroup } from '../dynamic-form-group';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { of, throwError } from 'rxjs';

import { Person } from 'src/app/people/models/person.model';
import { PeopleService } from 'src/app/people/service/people.service';
import { BindQueryparamToInput } from 'src/app/shared/directives/bind-queryparam-to-input';
import { EmailInput } from './email-input';
import { EmailInputHarness } from './email-input.harness';

// sc-2233 (e-mailinput met validaties), sc-2250 en sc-2178 (e-mail uit de query params).
describe('EmailInput', () => {
    beforeEach(() => {
        vi.useFakeTimers({ advanceTimeDelta: 1, shouldAdvanceTime: true });
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    let fixture: ComponentFixture<EmailInput>;
    let component: EmailInput;
    let harness: EmailInputHarness;
    let form: DynamicFormGroup;
    let people: Record<string, any>;

    async function create(inputs: Record<string, unknown> = {}) {
        form = new FormGroup({});
        fixture = TestBed.createComponent(EmailInput);
        component = fixture.componentInstance;
        component.parentFormGroup = form;
        for (const [naam, waarde] of Object.entries(inputs)) fixture.componentRef.setInput(naam, waarde);
        harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, EmailInputHarness);
    }

    async function typeAndBlur(value: string) {
        await harness.setValue(value);
        await harness.blur();
    }

    beforeEach(async () => {
        people = {
            findPersonByEmail: vi.fn().mockName("PeopleService.findPersonByEmail")
        };
        await TestBed.configureTestingModule({
    imports: [ReactiveFormsModule, FontAwesomeModule, EmailInput, BindQueryparamToInput],
    providers: [provideRouter([]), { provide: PeopleService, useValue: people }]
}).compileComponents();
    });

    it('voegt een control "email" toe aan het parent-formulier', async () => {
        await create();
        expect(form.get('email')).toBeTruthy();
        expect(await harness.getPlaceholder()).toBe('Email (login)');
    });

    it('gebruikt een andere controlnaam als die meegegeven wordt', async () => {
        await create({ controlName: 'adres' });
        expect(form.get('adres')).toBeTruthy();
    });

    it('leeg en aangeraakt: foutmelding "verplicht"', async () => {
        await create();
        await typeAndBlur('');
        expect(form.valid).toBe(false);
        expect(await harness.getErrorText()).toContain('Email is een verplicht veld');
    });

    it('ongeldig formaat: foutmelding over het formaat', async () => {
        await create();
        await typeAndBlur('geen-email');
        expect(await harness.getErrorText()).toContain('Geef een geldig emailadres in');
    });

    it('geldig adres zonder bestaanscontrole: geen foutmelding', async () => {
        await create();
        await typeAndBlur('iemand@gimmi.be');
        expect(form.valid).toBe(true);
        expect(await harness.getErrorText()).toBe('');
        expect(people.findPersonByEmail).not.toHaveBeenCalled();
    });

    describe('met bestaanscontrole', () => {
        it('bekend adres: melding met een link naar de wensenlijst', async () => {
            people.findPersonByEmail.mockReturnValue(of(new Person('p1', 'Ria', 'Receiver')));
            await create({ emailExistsValidation: true });
            await typeAndBlur('ria@gimmi.be');
            expect(people.findPersonByEmail).toHaveBeenCalledWith('ria@gimmi.be');
            expect(form.get('email').errors).toEqual({ emailExists: true });
            expect(await harness.getErrorText()).toContain('Bekijk de wensen van Ria Receiver');
        });

        it('bekend adres met redirect naar login: link om in te loggen', async () => {
            people.findPersonByEmail.mockReturnValue(of(new Person('p1', 'Ria', 'Receiver')));
            await create({ emailExistsValidation: true, emailExistsRedirectTo: 'login' });
            await typeAndBlur('ria@gimmi.be');
            expect(await harness.getErrorText()).toContain('Login met dit emailadres');
        });

        it('onbekend adres: geldig', async () => {
            people.findPersonByEmail.mockReturnValue(throwError('404'));
            await create({ emailExistsValidation: true });
            await typeAndBlur('nieuw@gimmi.be');
            expect(form.get('email').valid).toBe(true);
        });

        it('valideert pas bij blur, niet bij elke toetsaanslag', async () => {
            people.findPersonByEmail.mockReturnValue(throwError('404'));
            await create({ emailExistsValidation: true });
            await harness.setValue('nieuw@gimmi.be');
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

        it('vult het veld in met de waarde van ?e=', async () => {
            history.replaceState(null, '', location.pathname + '?e=uit%40url.be');
            await create({ bindedQueryParam: 'e' });
            await vi.advanceTimersByTimeAsync(0);
            expect(form.get('email').value).toBe('uit@url.be');
        });

        it('zonder die parameter blijft het veld leeg', async () => {
            history.replaceState(null, '', location.pathname);
            await create({ bindedQueryParam: 'e' });
            await vi.advanceTimersByTimeAsync(0);
            expect(form.get('email').value).toBeNull();
        });
    });
});
