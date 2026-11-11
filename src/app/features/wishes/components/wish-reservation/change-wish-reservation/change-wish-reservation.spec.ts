import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';

import { Person } from 'src/app/features/people/models/person.model';
import { Notifications } from 'src/app/core/notifications';
import { Wish } from '../../../models/wish.model';
import { WishesData } from '../../../wishes-data';
import { ChangeWishReservation } from './change-wish-reservation';

// Popup om je eigen reservatie weer te verwijderen.
describe('ChangeWishReservation', () => {
    const ria = new Person('ria', 'Ria', 'Receiver');
    let fixture: ComponentFixture<ChangeWishReservation>;
    let activeModal: Record<string, any>;
    let wishService: Record<string, any>;
    let notifications: Record<string, any>;

    function el(): HTMLElement { return fixture.nativeElement; }

    beforeEach(async () => {
        const wish = new Wish('w1', 'Fiets', 250, null, ria, ria, null, null, null, 1);
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

    it('toont de wens en de voornaam van de ontvanger', () => {
        expect(el().querySelector('.modal-body p').textContent).toContain('Fiets van Ria');
    });

    it('"Verwijder reservatie" verwijdert de reservatie, sluit de popup en meldt dat', () => {
        (el().querySelector('.btn-outline-danger') as HTMLButtonElement).click();
        expect(wishService.deleteReservation).toHaveBeenCalledWith(fixture.componentInstance.wish);
        expect(notifications.showNotification).toHaveBeenCalledWith('Je reservatie van Fiets voor Ria is verwijderd.', 'info', 'Reservatie geannuleerd');
        expect(activeModal.close).toHaveBeenCalled();
    });

    it('"Behoud reservatie" sluit zonder te verwijderen', () => {
        (el().querySelector('.modal-footer .btn-danger') as HTMLButtonElement).click();
        expect(activeModal.dismiss).toHaveBeenCalledWith('Cancel');
        expect(wishService.deleteReservation).not.toHaveBeenCalled();
    });
});
