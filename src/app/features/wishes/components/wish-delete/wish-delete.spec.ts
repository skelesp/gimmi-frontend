import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';

import { Notifications } from 'src/app/core/notifications';
import { Wish } from 'src/app/features/wishes/wish';
import { WishesData } from '../../wishes-data';
import { WishDelete } from './wish-delete';
import { apiWish } from 'src/app/features/wishes/wish.testing';

// Bevestigingspopup om een wens te verwijderen.
describe('WishDelete', () => {
    const ria = { id: 'ria', firstName: 'Ria', lastName: 'Receiver' };
    let fixture: ComponentFixture<WishDelete>;
    let activeModal: Record<string, any>;
    let wishService: Record<string, any>;
    let notifications: Record<string, any>;

    function el(): HTMLElement { return fixture.nativeElement; }

    beforeEach(async () => {
        const wish = apiWish({ id: 'w1', title: 'Fiets', price: { amount: 25000, currency: 'EUR' }, links: [], receiver: ria, createdBy: ria });
        activeModal = { close: vi.fn(), dismiss: vi.fn() };
        wishService = { delete: vi.fn().mockReturnValue(of(wish)) };
        notifications = { showNotification: vi.fn() };
        await TestBed.configureTestingModule({
            imports: [WishDelete],
            providers: [
                { provide: NgbActiveModal, useValue: activeModal },
                { provide: WishesData, useValue: wishService },
                { provide: Notifications, useValue: notifications }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(WishDelete);
        fixture.componentInstance.wish = wish;
        await fixture.whenStable();
    });

    it('vraagt bevestiging met de titel van de wens', () => {
        expect(el().querySelector('.modal-body').textContent).toContain('"Fiets"');
    });

    it('"Ja, verwijder" sluit de popup, verwijdert de wens en meldt dat', () => {
        (el().querySelector('.btn-danger') as HTMLButtonElement).click();
        expect(activeModal.close).toHaveBeenCalled();
        expect(wishService.delete).toHaveBeenCalledWith(fixture.componentInstance.wish);
        expect(notifications.showNotification).toHaveBeenCalledWith('Wens "Fiets" is verwijderd.', 'success', 'Wens verwijderd');
    });

    it('"Nee, wens behouden" annuleert zonder te verwijderen', () => {
        (el().querySelector('.btn-outline-danger') as HTMLButtonElement).click();
        expect(activeModal.dismiss).toHaveBeenCalledWith('Cancel');
        expect(wishService.delete).not.toHaveBeenCalled();
    });
});
