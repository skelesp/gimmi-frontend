import type { Mock } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';

import { Notifications } from 'src/app/core/notifications';
import { WishesData } from '../../../wishes-data';
import { ChangeWishReservation } from './change-wish-reservation';
import { apiWish } from 'src/app/features/wishes/wish.testing';

// Popup to remove your own reservation again.
describe('ChangeWishReservation', () => {
    const ria = { id: 'ria', firstName: 'Ria', lastName: 'Receiver' };
    let fixture: ComponentFixture<ChangeWishReservation>;
    let activeModal: Record<string, Mock>;
    let wishService: Record<string, Mock>;
    let notifications: Record<string, Mock>;

    function el(): HTMLElement { return fixture.nativeElement; }

    beforeEach(async () => {
        const wish = apiWish({ id: 'w1', title: 'Fiets', price: { amount: 25000, currency: 'EUR' }, links: [], receiver: ria, createdBy: ria });
        activeModal = { close: vi.fn(), dismiss: vi.fn() };
        wishService = { deleteReservation: vi.fn().mockReturnValue(of(wish)) };
        notifications = { showNotification: vi.fn() };
        await TestBed.configureTestingModule({
            imports: [ChangeWishReservation],
            providers: [
                { provide: NgbActiveModal, useValue: activeModal },
                { provide: WishesData, useValue: wishService },
                { provide: Notifications, useValue: notifications }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(ChangeWishReservation);
        fixture.componentInstance.wish = wish;
        await fixture.whenStable();
    });

    it('shows the wish and the first name of the recipient', () => {
        expect(el().querySelector('.modal-body p').textContent).toContain('Fiets van Ria');
    });

    it('"Verwijder reservatie" removes the reservation, closes the popup and reports that', () => {
        (el().querySelector('.btn-outline-danger') as HTMLButtonElement).click();
        expect(wishService.deleteReservation).toHaveBeenCalledWith(fixture.componentInstance.wish);
        expect(notifications.showNotification).toHaveBeenCalledWith('Je reservatie van Fiets voor Ria is verwijderd.', 'info', 'Reservatie geannuleerd');
        expect(activeModal.close).toHaveBeenCalled();
    });

    it('"Behoud reservatie" closes without removing', () => {
        (el().querySelector('.modal-footer .btn-danger') as HTMLButtonElement).click();
        expect(activeModal.dismiss).toHaveBeenCalledWith('Cancel');
        expect(wishService.deleteReservation).not.toHaveBeenCalled();
    });
});
