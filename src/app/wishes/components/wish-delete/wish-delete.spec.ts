import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';

import { Person } from 'src/app/people/models/person.model';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { Wish } from '../../models/wish.model';
import { WishService } from '../../services/wish.service';
import { WishDelete } from './wish-delete';

// Bevestigingspopup om een wens te verwijderen.
describe('WishDelete', () => {
    const ria = new Person('ria', 'Ria', 'Receiver');
    let fixture: ComponentFixture<WishDelete>;
    let activeModal: Record<string, any>;
    let wishService: Record<string, any>;
    let notifications: Record<string, any>;

    function el(): HTMLElement { return fixture.nativeElement; }

    beforeEach(async () => {
        const wish = new Wish('w1', 'Fiets', 250, null, ria, ria, null, null, null, 1);
        activeModal = { close: vi.fn(), dismiss: vi.fn() };
        wishService = { delete: vi.fn().mockReturnValue(of(wish)) };
        notifications = { showNotification: vi.fn() };
        await TestBed.configureTestingModule({
            imports: [WishDelete],
            providers: [
                { provide: NgbActiveModal, useValue: activeModal },
                { provide: WishService, useValue: wishService },
                { provide: NotificationService, useValue: notifications }
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
