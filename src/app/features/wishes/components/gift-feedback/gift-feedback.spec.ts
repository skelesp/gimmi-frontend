import type { Mock } from 'vitest';
import type { Schema } from 'src/app/core/api/api-types';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgbActiveModal, NgbRating } from '@ng-bootstrap/ng-bootstrap';

import { GiftFeedback } from './gift-feedback';
import { apiWish } from 'src/app/features/wishes/wish.testing';

// Feedback popup for a received gift.
describe('GiftFeedback', () => {
    const ria = { id: 'ria', firstName: 'Ria', lastName: 'Receiver' };
    const rob = { id: 'rob', firstName: 'Rob', lastName: 'Reservator' };
    let fixture: ComponentFixture<GiftFeedback>;
    let activeModal: Record<string, Mock>;

    function el(): HTMLElement { return fixture.nativeElement; }
    function save(): HTMLButtonElement { return el().querySelector('.modal-footer .btn-danger'); }
    function rate(value: number) { fixture.debugElement.query(By.directive(NgbRating)).triggerEventHandler('rateChange', value); }
    async function typeInto(selector: string, value: string) {
        const field = el().querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
        field.value = value;
        field.dispatchEvent(new Event('input'));
        await fixture.whenStable();
    }

    beforeEach(async () => {
        activeModal = { close: vi.fn(), dismiss: vi.fn() };
        await TestBed.configureTestingModule({
            imports: [GiftFeedback],
            providers: [{ provide: NgbActiveModal, useValue: activeModal }]
        }).compileComponents();
        fixture = TestBed.createComponent(GiftFeedback);
        fixture.componentInstance.wish = apiWish({
            id: 'w1', title: 'Fiets', price: { amount: 25000, currency: 'EUR' }, links: [], receiver: ria, createdBy: ria,
            reservation: { reservedBy: rob, reservedAt: '2026-03-05T12:00:00Z' }
        });
        await fixture.whenStable();
    });

    it('mentions who gave the gift and fills in the date with the reservation date', () => {
        expect(el().querySelector('.alert').textContent).toContain('Je kreeg het cadeau "Fiets" van Rob Reservator');
        expect(el().querySelector<HTMLInputElement>('#receivedOn').value).toBe('2026-03-05');
    });

    it('without reservation date (the server does not show it): the handover date, otherwise today', async () => {
        const open = async (reservation: Schema<'Reservation'>) => {
            fixture = TestBed.createComponent(GiftFeedback);
            fixture.componentInstance.wish = apiWish({ id: 'w1', title: 'Fiets', receiver: ria, createdBy: ria, reservation });
            await fixture.whenStable();
            return el().querySelector<HTMLInputElement>('#receivedOn').value;
        };
        expect(await open({ reservedBy: rob, handoverDate: '2026-04-01' })).toBe('2026-04-01');
        expect(await open({ reservedBy: rob })).toBe(new Date().toISOString().slice(0, 10));
    });

    it('saving is only possible with a satisfaction', async () => {
        expect(save().disabled).toBe(true);
        rate(4);
        await fixture.whenStable();
        expect(save().disabled).toBe(false);
    });

    it('without a date it cannot be saved and a notice appears', async () => {
        rate(4);
        await typeInto('#receivedOn', '');
        el().querySelector('#receivedOn').dispatchEvent(new Event('blur'));
        await fixture.whenStable();
        expect(save().disabled).toBe(true);
        expect(el().textContent).toContain('De afgiftedatum moet ingevuld worden.');
    });

    it('a date in the future is refused', async () => {
        rate(4);
        await typeInto('#receivedOn', '2999-01-01');
        el().querySelector('#receivedOn').dispatchEvent(new Event('blur'));
        await fixture.whenStable();
        expect(save().disabled).toBe(true);
        expect(el().textContent).toContain('De afgiftedatum kan niet in de toekomst liggen.');
    });

    it('saving closes the popup with the feedback for API v2 (satisfaction as number, date as text)', async () => {
        rate(5);
        await typeInto('#message', 'Dank!');
        el().querySelector<HTMLInputElement>('#putBackOnList').click();
        await fixture.whenStable();
        save().click();
        await fixture.whenStable();
        expect(activeModal.close).toHaveBeenCalledWith({ satisfaction: 5, receivedOn: '2026-03-05', message: 'Dank!', putBackOnList: true });
    });

    it('an empty message is sent as null', async () => {
        rate(3);
        await fixture.whenStable();
        save().click();
        await fixture.whenStable();
        expect(activeModal.close).toHaveBeenCalledWith({ satisfaction: 3, receivedOn: '2026-03-05', message: null, putBackOnList: false });
    });

    it('cancelling and closing via the cross', () => {
        (el().querySelector('.btn-outline-danger') as HTMLButtonElement).click();
        expect(activeModal.dismiss).toHaveBeenCalledWith('Cancel');
        (el().querySelector('.btn-close') as HTMLButtonElement).click();
        expect(activeModal.dismiss).toHaveBeenCalledWith('Cross click');
    });
});
