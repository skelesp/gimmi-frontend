import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';

import { Person } from 'src/app/people/models/person.model';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { User } from 'src/app/users/models/user.model';
import { UserService } from 'src/app/users/service/user.service';
import { ImageViewComponent } from '../../../images/components/image-view/image-view.component';
import { Wish } from '../../models/wish.model';
import { WishService } from '../../services/wish.service';
import { WishCreateCardComponent } from './wish-create-card.component';

// Kaart "Voeg wens toe" vooraan in de wenslijst.
describe('WishCreateCardComponent', () => {
    const ria = new Person('ria', 'Ria', 'Receiver');
    const rob = new User('rob', 'Reservator', 'Rob', 'rob@gimmi.be', 'local', 't', []);
    let fixture: ComponentFixture<WishCreateCardComponent>;
    let modal: Record<string, any>;
    let popup: { componentInstance: Record<string, any>; result: Promise<any> };
    let wishService: Record<string, any>;
    let notifications: Record<string, any>;

    function klik() {
        (fixture.nativeElement.querySelector('.card-img-overlay') as HTMLElement).click();
    }

    function open(result: Promise<any>) {
        popup = { componentInstance: {}, result };
        modal.open.mockReturnValue(popup);
    }

    beforeEach(async () => {
        modal = { open: vi.fn() };
        wishService = { create: vi.fn() };
        notifications = { showNotification: vi.fn() };
        vi.spyOn(console, 'warn').mockImplementation(() => { });
        TestBed.overrideComponent(WishCreateCardComponent, { remove: { imports: [ImageViewComponent] }, add: { schemas: [CUSTOM_ELEMENTS_SCHEMA] } });
        await TestBed.configureTestingModule({
            imports: [WishCreateCardComponent],
            providers: [
                { provide: NgbModal, useValue: modal },
                { provide: WishService, useValue: wishService },
                { provide: NotificationService, useValue: notifications },
                { provide: UserService, useValue: { currentUser: rob } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(WishCreateCardComponent);
        fixture.componentInstance.receiver = ria;
        await fixture.whenStable();
    });

    it('toont de uitnodiging om een wens toe te voegen', () => {
        expect(fixture.nativeElement.textContent).toContain('Voeg wens toe');
    });

    it('opent de popup in create-modus en bewaart de wens met de ingelogde gebruiker als maker', async () => {
        const wish = new Wish(null, 'Fiets', 250, null, null, null, null, null, null, 1);
        wishService.create.mockReturnValue(of(wish));
        open(Promise.resolve(wish));
        klik();
        await popup.result;
        await Promise.resolve();
        expect(popup.componentInstance['mode']).toBe('create');
        expect(wish.createdBy.id).toBe('rob');
        expect(wish.receiver).toBe(ria);
        expect(wishService.create).toHaveBeenCalledWith(wish);
        expect(notifications.showNotification).toHaveBeenCalledWith("De wens 'Fiets' werd toegevoegd aan deze lijst.", 'success', 'Wens toegevoegd');
    });

    it('sluiten van de popup met ESC bewaart niets', async () => {
        open(Promise.reject(ModalDismissReasons.ESC));
        klik();
        await new Promise(r => setTimeout(r));
        expect(wishService.create).not.toHaveBeenCalled();
        expect(console.warn).toHaveBeenCalledWith('Wish Create popup is closed: ESC pressed');
    });

    it('klikken naast de popup bewaart niets', async () => {
        open(Promise.reject(ModalDismissReasons.BACKDROP_CLICK));
        klik();
        await new Promise(r => setTimeout(r));
        expect(console.warn).toHaveBeenCalledWith('Wish Create popup is closed: Backdrop click');
    });

    it('een andere sluitreden wordt doorgegeven', async () => {
        open(Promise.reject('Cancel'));
        klik();
        await new Promise(r => setTimeout(r));
        expect(console.warn).toHaveBeenCalledWith('Wish Create popup is closed: Cancel');
    });
});
