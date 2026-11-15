import type { Mock } from 'vitest';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';

import { Notifications } from 'src/app/core/notifications';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { Wish } from 'src/app/features/wishes/wish';
import { WishesData } from '../../wishes-data';
import { WishReservation } from './wish-reservation';
import { apiWish } from 'src/app/features/wishes/wish.testing';

// Reservation popup with handover date and occasion (sc-1892).
describe('WishReservation', () => {
    const ria = { id: 'ria', firstName: 'Ria', lastName: 'Receiver' };
    let fixture: ComponentFixture<WishReservation>;
    let activeModal: Record<string, Mock>;
    let wishService: Record<string, Mock>;
    let notifications: Record<string, Mock>;

    function el(): HTMLElement { return fixture.nativeElement; }
    function button(): HTMLButtonElement { return el().querySelector('button[type="submit"]'); }
    function reasonSelect(): HTMLSelectElement { return el().querySelector('#reservationReason'); }

    async function choose(option: string) {
        const select = reasonSelect();
        select.value = Array.from(select.options).find(o => o.textContent.trim() === option).value;
        select.dispatchEvent(new Event('input'));
        select.dispatchEvent(new Event('change'));
        await fixture.whenStable();
    }

    beforeEach(async () => {
        activeModal = {
            close: vi.fn().mockName("NgbActiveModal.close"),
            dismiss: vi.fn().mockName("NgbActiveModal.dismiss")
        };
        wishService = {
            addReservation: vi.fn().mockName("WishesData.addReservation")
        };
        notifications = {
            showNotification: vi.fn().mockName("Notifications.showNotification")
        };
        await TestBed.configureTestingModule({
    imports: [WishReservation],
    providers: [
        { provide: NgbActiveModal, useValue: activeModal },
        { provide: AuthStore, useValue: fakeAuthStore(testUser({ id: 'rob', firstName: 'Rob', lastName: 'Reservator', fullName: 'Rob Reservator', email: 'rob@gimmi.be' })) },
        { provide: WishesData, useValue: wishService },
        { provide: Notifications, useValue: notifications }
    ]
}).compileComponents();
        fixture = TestBed.createComponent(WishReservation);
        fixture.componentInstance.wish = apiWish({ id: 'w1', title: 'Fiets', price: { amount: 25000, currency: 'EUR' }, links: [], receiver: ria, createdBy: ria });
        await fixture.whenStable();
    });

    it('title and explanation with the wish and the first name of the recipient', () => {
        expect(el().querySelector('.modal-title').textContent).toContain('Reserveer Fiets');
        expect(el().textContent).toContain('Wanneer geef je het cadeau aan Ria?');
        expect(el().textContent).toContain('Je reservatie blijft onzichtbaar voor Ria tot na deze datum.');
    });

    it('handover date defaults to today', () => {
        const date: HTMLInputElement = el().querySelector('#handoverDate');
        expect(date.type).toBe('date');
        expect(date.value).toBe(new Date().toISOString().substring(0, 10));
    });

    it('occasions in fixed order', () => {
        const options = Array.from(reasonSelect().options).filter(o => !o.hidden).map(o => o.textContent.trim());
        expect(options).toEqual(['Verjaardag', 'Sinterklaas', 'Kerstmis', 'Nieuwjaar', 'Housewarming', 'Geboorte', 'Huwelijk',
            'Afscheid collega', 'Afscheid', 'Communie / Lentefeest', 'Vader/moederdag', 'Andere reden']);
    });

    it('gelegenheid is verplicht: knop uit en melding na aanraken', async () => {
        expect(button().disabled).toBe(true);
        reasonSelect().dispatchEvent(new Event('blur'));
        await fixture.whenStable();
        expect(el().textContent).toContain('De gelegenheid is een verplicht veld.');
        await choose('Kerstmis');
        expect(button().disabled).toBe(false);
        expect(el().textContent).not.toContain('De gelegenheid is een verplicht veld.');
    });

    it('reserving: sends the handover date and the occasion as code, reports that and closes the popup', async () => {
        wishService.addReservation.mockImplementation((w: Wish) => of(w));
        await choose('Verjaardag');
        const date: HTMLInputElement = el().querySelector('#handoverDate');
        date.value = '2026-12-24';
        date.dispatchEvent(new Event('input'));
        await fixture.whenStable();
        button().click();

        expect(wishService.addReservation).toHaveBeenCalledWith(fixture.componentInstance.wish, { handoverDate: '2026-12-24', occasion: 'birthday' });
        expect(notifications.showNotification).toHaveBeenCalledWith('Wens Fiets is gereserveerd. U hoeft dit perfecte cadeau enkel nog te kopen en af te geven!', 'success', 'Gereserveerd');
        expect(activeModal.close).toHaveBeenCalled();
    });

    it('cancelling and the cross: nothing reserved', () => {
        el().querySelector<HTMLButtonElement>('.modal-footer .btn-outline-danger').click();
        el().querySelector<HTMLButtonElement>('button.btn-close').click();
        expect(vi.mocked(activeModal.dismiss).mock.calls).toEqual([['Cancel'], ['Cross click']]);
        expect(wishService.addReservation).not.toHaveBeenCalled();
    });
});
