
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';

import { Person } from 'src/app/people/models/person.model';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { Wish } from '../../models/wish.model';
import { WishService } from '../../services/wish.service';
import { WishReservation } from './wish-reservation';

// Reservatiepopup met overhandigingsdatum en gelegenheid (sc-1892).
describe('WishReservation', () => {
    const ria = new Person('ria', 'Ria', 'Receiver');
    let fixture: ComponentFixture<WishReservation>;
    let activeModal: Record<string, any>;
    let wishService: Record<string, any>;
    let notifications: Record<string, any>;

    function el(): HTMLElement { return fixture.nativeElement; }
    function knop(): HTMLButtonElement { return el().querySelector('button[type="submit"]'); }
    function reden(): HTMLSelectElement { return el().querySelector('#reservationReason'); }

    async function kies(optie: string) {
        const select = reden();
        select.value = Array.from(select.options).find(o => o.textContent.trim() === optie).value;
        select.dispatchEvent(new Event('change'));
        await fixture.whenStable();
    }

    beforeEach(async () => {
        activeModal = {
            close: vi.fn().mockName("NgbActiveModal.close"),
            dismiss: vi.fn().mockName("NgbActiveModal.dismiss")
        };
        wishService = {
            addReservation: vi.fn().mockName("WishService.addReservation")
        };
        notifications = {
            showNotification: vi.fn().mockName("NotificationService.showNotification")
        };
        await TestBed.configureTestingModule({
    imports: [ReactiveFormsModule, WishReservation],
    providers: [
        { provide: NgbActiveModal, useValue: activeModal },
        { provide: AuthStore, useValue: fakeAuthStore(testUser({ id: 'rob', firstName: 'Rob', lastName: 'Reservator', fullName: 'Rob Reservator', email: 'rob@gimmi.be' })) },
        { provide: WishService, useValue: wishService },
        { provide: NotificationService, useValue: notifications }
    ]
}).compileComponents();
        fixture = TestBed.createComponent(WishReservation);
        fixture.componentInstance.wish = new Wish('w1', 'Fiets', 250, null, ria, ria, null, null, null, 1);
        await fixture.whenStable();
    });

    it('titel en uitleg met de wens en de voornaam van de ontvanger', () => {
        expect(el().querySelector('.modal-title').textContent).toContain('Reserveer Fiets');
        expect(el().textContent).toContain('Wanneer geef je het cadeau aan Ria?');
        expect(el().textContent).toContain('Je reservatie blijft onzichtbaar voor Ria tot na deze datum.');
    });

    it('overhandigingsdatum staat standaard op vandaag', () => {
        const datum: HTMLInputElement = el().querySelector('#handoverDate');
        expect(datum.type).toBe('date');
        expect(datum.value).toBe(new Date().toISOString().substring(0, 10));
    });

    it('gelegenheden in vaste volgorde', () => {
        const opties = Array.from(reden().options).filter(o => !o.hidden).map(o => o.textContent.trim());
        expect(opties).toEqual(['Verjaardag', 'Sinterklaas', 'Kerstmis', 'Nieuwjaar', 'Housewarming', 'Geboorte', 'Huwelijk',
            'Afscheid collega', 'Afscheid', 'Communie / Lentefeest', 'Vader/moederdag', 'Andere reden']);
    });

    it('gelegenheid is verplicht: knop uit en melding na aanraken', async () => {
        expect(knop().disabled).toBe(true);
        reden().dispatchEvent(new Event('blur'));
        await fixture.whenStable();
        expect(el().textContent).toContain('De gelegenheid is een verplicht veld.');
        await kies('Kerstmis');
        expect(knop().disabled).toBe(false);
        expect(el().textContent).not.toContain('De gelegenheid is een verplicht veld.');
    });

    it('reserveren: stuurt de overhandigingsdatum en de gelegenheid als code, meldt dat en sluit de popup', async () => {
        wishService.addReservation.mockImplementation((w: Wish) => of(w));
        await kies('Verjaardag');
        const datum: HTMLInputElement = el().querySelector('#handoverDate');
        datum.value = '2026-12-24';
        datum.dispatchEvent(new Event('input'));
        await fixture.whenStable();
        knop().click();

        expect(wishService.addReservation).toHaveBeenCalledWith(fixture.componentInstance.wish, { handoverDate: '2026-12-24', occasion: 'birthday' });
        expect(notifications.showNotification).toHaveBeenCalledWith('Wens Fiets is gereserveerd. U hoeft dit perfecte cadeau enkel nog te kopen en af te geven!', 'success', 'Gereserveerd');
        expect(activeModal.close).toHaveBeenCalled();
    });

    it('annuleren en het kruisje: niets gereserveerd', () => {
        el().querySelector<HTMLButtonElement>('.modal-footer .btn-outline-danger').click();
        el().querySelector<HTMLButtonElement>('button.btn-close').click();
        expect(vi.mocked(activeModal.dismiss).mock.calls).toEqual([['Cancel'], ['Cross click']]);
        expect(wishService.addReservation).not.toHaveBeenCalled();
    });
});
