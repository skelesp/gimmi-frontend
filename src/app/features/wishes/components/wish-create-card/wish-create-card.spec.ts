import type { Mock } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';

import { Notifications } from 'src/app/core/notifications';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { ImageView } from '../../../images/components/image-view/image-view';
import { WishDraft } from 'src/app/features/wishes/wish';
import { WishesData } from '../../wishes-data';
import { WishCreateCard } from './wish-create-card';
import { apiWish } from 'src/app/features/wishes/wish.testing';

// "Voeg wens toe" card at the front of the wish list.
describe('WishCreateCard', () => {
    const ria = { id: 'ria', firstName: 'Ria', lastName: 'Receiver' };
    const rob = testUser({ id: 'rob', firstName: 'Rob', lastName: 'Reservator', fullName: 'Rob Reservator', email: 'rob@gimmi.be' });
    let fixture: ComponentFixture<WishCreateCard>;
    let modal: Record<string, Mock>;
    let popup: { componentInstance: Record<string, unknown>; result: Promise<unknown> };
    let wishService: Record<string, Mock>;
    let notifications: Record<string, Mock>;

    function click() {
        (fixture.nativeElement.querySelector('.card-img-overlay') as HTMLElement).click();
    }

    function open(result: Promise<unknown>) {
        popup = { componentInstance: {}, result };
        modal.open.mockReturnValue(popup);
    }

    beforeEach(async () => {
        modal = { open: vi.fn() };
        wishService = { create: vi.fn() };
        notifications = { showNotification: vi.fn() };
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        TestBed.overrideComponent(WishCreateCard, { remove: { imports: [ImageView] }, add: { schemas: [CUSTOM_ELEMENTS_SCHEMA] } });
        await TestBed.configureTestingModule({
            imports: [WishCreateCard],
            providers: [
                { provide: NgbModal, useValue: modal },
                { provide: WishesData, useValue: wishService },
                { provide: Notifications, useValue: notifications },
                { provide: AuthStore, useValue: fakeAuthStore(rob) }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(WishCreateCard);
        fixture.componentInstance.receiver = ria;
        await fixture.whenStable();
    });

    it('shows the invitation to add a wish', () => {
        expect(fixture.nativeElement.textContent).toContain('Voeg wens toe');
    });

    it('opens the popup in create mode and saves the wish on the recipient\'s list', async () => {
        const draft: WishDraft = { title: 'Fiets', price: 250, url: '', color: '', size: '', description: '', image: null, copyOf: null };
        const wish = apiWish({ title: 'Fiets', price: { amount: 25000, currency: 'EUR' }, links: [] });
        wishService.create.mockReturnValue(of(wish));
        open(Promise.resolve(draft));
        click();
        await popup.result;
        await Promise.resolve();
        expect(popup.componentInstance['mode']).toBe('create');
        expect(wishService.create).toHaveBeenCalledWith(draft, 'ria');
        expect(notifications.showNotification).toHaveBeenCalledWith("De wens 'Fiets' werd toegevoegd aan deze lijst.", 'success', 'Wens toegevoegd');
    });

    it('closing the popup with ESC saves nothing', async () => {
        open(Promise.reject(ModalDismissReasons.ESC));
        click();
        await new Promise(r => setTimeout(r));
        expect(wishService.create).not.toHaveBeenCalled();
        expect(console.warn).toHaveBeenCalledWith('Wish Create popup is closed: ESC pressed');
    });

    it('clicking next to the popup saves nothing', async () => {
        open(Promise.reject(ModalDismissReasons.BACKDROP_CLICK));
        click();
        await new Promise(r => setTimeout(r));
        expect(console.warn).toHaveBeenCalledWith('Wish Create popup is closed: Backdrop click');
    });

    it('another dismiss reason is passed on', async () => {
        open(Promise.reject('Cancel'));
        click();
        await new Promise(r => setTimeout(r));
        expect(console.warn).toHaveBeenCalledWith('Wish Create popup is closed: Cancel');
    });
});
