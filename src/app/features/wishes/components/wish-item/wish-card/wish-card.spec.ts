import type { Mock } from 'vitest';
import { provideRouter } from '@angular/router';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';

import { ImagesData } from 'src/app/features/images/images-data';
import { viewWishAs } from 'src/app/features/wishes/wish.testing';
import { Notifications } from 'src/app/core/notifications';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { Wish, WishStatus } from 'src/app/features/wishes/wish';
import { toDraft } from 'src/app/features/wishes/wishes-data';
import type { PersonRef } from 'src/app/features/people/service/people';
import { WishesData } from '../../../wishes-data';
import { GiftFeedback } from '../../gift-feedback/gift-feedback';
import { WishDelete } from '../../wish-delete/wish-delete';
import { ChangeWishReservation } from '../../wish-reservation/change-wish-reservation/change-wish-reservation';
import { WishReservation } from '../../wish-reservation/wish-reservation';
import { ActionListItem } from '../action-list/action-list-item/action-list-item';
import { ActionList } from '../action-list/action-list';
import { WishBanner } from '../wish-banner/wish-banner';
import { WishCallToActionButton } from '../wish-call-to-action-button/wish-call-to-action-button';
import { WishPopup } from '../wish-popup/wish-popup';
import { WishCard } from './wish-card';
import { ImageView } from '../../../../images/components/image-view/image-view';
import { apiWish } from 'src/app/features/wishes/wish.testing';

// What a wish card shows per scenario (sc-1955, sc-1960, sc-2446, sc-2453, sc-2558, sc-2566) and
// which actions it offers (sc-1978, sc-1982). Logic comes from WishItem.
describe('WishCard', () => {
    beforeEach(() => {
        vi.useFakeTimers({ advanceTimeDelta: 1, shouldAdvanceTime: true });
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    const ria = { id: 'ria', firstName: 'Ria', lastName: 'Receiver' };
    const rob = { id: 'rob', firstName: 'Rob', lastName: 'Reservator' };
    const carl = { id: 'carl', firstName: 'Carl', lastName: 'Creator' };

    let fixture: ComponentFixture<WishCard>;
    let component: WishCard;
    let modal: Record<string, Mock>;
    let wishService: Record<string, Mock>;
    let images: Record<string, Mock>;
    let notifications: Record<string, Mock>;
    let popup: {
        componentInstance: Record<string, unknown>;
        result: Promise<unknown>;
    };

    function makeWish(options: {
        status: WishStatus;
        createdBy?: PersonRef;
        reservedBy?: PersonRef;
        url?: string;
        viewer: string;
    }): Wish {
        const w = apiWish({
            id: 'w1', title: 'Boek', price: { amount: 2000, currency: 'EUR' }, links: options.url ? [{ url: options.url }] : [],
            receiver: ria, createdBy: options.createdBy ?? ria, status: options.status,
            reservation: options.reservedBy ? { reservedBy: options.reservedBy } : null
        });
        return viewWishAs(w, options.viewer);
    }

    async function show(wish: Wish) {
        fixture = TestBed.createComponent(WishCard);
        component = fixture.componentInstance;
        component.wish = wish;
        await fixture.whenStable();
    }

    function banner(): string {
        return (fixture.nativeElement.querySelector('gimmi-wish-banner')?.textContent || '').trim();
    }

    function cta(): HTMLButtonElement {
        return fixture.nativeElement.querySelector('gimmi-wish-call-to-action-button button');
    }

    function isBlurred(): boolean {
        return fixture.nativeElement.querySelector('.card-img-overlay').classList.contains('blurred-card-overlay');
    }

    function actions(): string[] {
        return component.wishActionItems.map(a => a.text);
    }

    beforeEach(async () => {
        popup = { componentInstance: {}, result: new Promise(() => undefined) };
        modal = {
            open: vi.fn().mockName("NgbModal.open")
        };
        modal.open.mockImplementation(() => popup);
        wishService = {
            fulfill: vi.fn().mockName("WishesData.fulfill"),
            update: vi.fn().mockName("WishesData.update"),
            create: vi.fn().mockName("WishesData.create")
        };
        images = {
            uploadImage: vi.fn().mockName("ImagesData.uploadImage"),
            hasImage: vi.fn().mockName("ImagesData.heeftBeeld")
        };
        notifications = {
            showNotification: vi.fn().mockName("Notifications.showNotification")
        };

        TestBed.overrideComponent(WishCard, { remove: { imports: [ImageView] }, add: { schemas: [CUSTOM_ELEMENTS_SCHEMA] } });
        await TestBed.configureTestingModule({
    imports: [FontAwesomeModule, NgbDropdownModule, WishCard, WishBanner, WishCallToActionButton, ActionList, ActionListItem],
    providers: [
        provideRouter([]),
        { provide: NgbModal, useValue: modal },
        { provide: WishesData, useValue: wishService },
        { provide: Notifications, useValue: notifications },
        { provide: AuthStore, useValue: fakeAuthStore(testUser({ id: 'rob', firstName: 'Rob', lastName: 'Reservator', fullName: 'Rob Reservator', email: 'rob@gimmi.be' })) },
        { provide: ImagesData, useValue: images }
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA] // gimmi-image-view
}).compileComponents();
    });

    describe('banner, button and blurring per scenario', () => {
        const cases: {
            name: string;
            wish: () => Wish;
            banner: string;
            button: string | null;
            blur: boolean;
        }[] = [
            { name: 'open wens van een ander', wish: () => makeWish({ status: 'open', viewer: 'rob' }), banner: '', button: 'Reserveer', blur: false },
            { name: 'open wens, jouw idee voor iemand anders', wish: () => makeWish({ status: 'open', createdBy: carl, viewer: 'carl' }), banner: 'Jouw idee', button: 'Reserveer', blur: false },
            { name: 'gereserveerd door een ander', wish: () => makeWish({ status: 'reserved', reservedBy: rob, viewer: 'iemand' }), banner: 'Gereserveerd', button: null, blur: true },
            { name: 'gereserveerd door jou', wish: () => makeWish({ status: 'reserved', reservedBy: rob, viewer: 'rob' }), banner: 'Gereserveerd door jou', button: 'Verwijder reservatie', blur: true },
            { name: 'gereserveerd, bekeken door de ontvanger (incognito)', wish: () => makeWish({ status: 'reserved', reservedBy: rob, viewer: 'ria' }), banner: '', button: 'Reserveer', blur: false },
            { name: 'ontvangen, bekeken door de ontvanger', wish: () => makeWish({ status: 'received', reservedBy: rob, viewer: 'ria' }), banner: 'Ontvangen', button: 'Geef feedback', blur: true },
            { name: 'ontvangen, gegeven door jou', wish: () => makeWish({ status: 'received', reservedBy: rob, viewer: 'rob' }), banner: 'Gegeven door jou', button: null, blur: true },
            { name: 'ontvangen, bekeken door een derde', wish: () => makeWish({ status: 'received', reservedBy: rob, viewer: 'iemand' }), banner: 'Ontvangen', button: null, blur: true },
            { name: 'vervuld', wish: () => makeWish({ status: 'fulfilled', reservedBy: rob, viewer: 'ria' }), banner: 'Wens vervuld', button: null, blur: true },
            { name: 'vervuld door jou', wish: () => makeWish({ status: 'fulfilled', reservedBy: rob, viewer: 'rob' }), banner: 'Wens vervuld door jou', button: null, blur: true }
        ];

        cases.forEach(g => {
            it(g.name, async () => {
                await show(g.wish());
                expect(banner()).toBe(g.banner);
                if (g.button)
                    expect(cta().textContent.trim()).toBe(g.button);
                else
                    expect(cta()).toBeNull();
                expect(isBlurred()).toBe(g.blur);
            });
        });
    });

    describe('actions in the menu', () => {
        it('own wish: edit and delete, not copy', async () => {
            await show(makeWish({ status: 'open', viewer: 'ria' }));
            expect(actions()).toEqual(['Aanpassen', 'Verwijderen']);
        });

        it('wish of someone else: only put on own list', async () => {
            await show(makeWish({ status: 'open', viewer: 'rob' }));
            expect(actions()).toEqual(['Zet op eigen lijst']);
        });

        it('idea you created for someone else: edit, copy and delete', async () => {
            await show(makeWish({ status: 'open', createdBy: carl, viewer: 'carl' }));
            expect(actions()).toEqual(['Aanpassen', 'Zet op eigen lijst', 'Verwijderen']);
        });

        it('with a url: "Externe website" at the top, with that url', async () => {
            await show(makeWish({ status: 'open', viewer: 'rob', url: 'www.winkel.be' }));
            expect(actions()[0]).toBe('Externe website');
            expect(component.wishActionItems[0].url).toBe('http://www.winkel.be');
        });

        it('"Toegevoegd door" only if someone else created the wish', async () => {
            await show(makeWish({ status: 'open', createdBy: carl, viewer: 'rob' }));
            expect(fixture.nativeElement.textContent).toContain('Toegevoegd door Carl C.');
            await show(makeWish({ status: 'open', viewer: 'rob' }));
            expect(fixture.nativeElement.textContent).not.toContain('Toegevoegd door');
        });
    });

    describe('popups', () => {
        it('Reserveer opens the reservation popup with this wish', async () => {
            await show(makeWish({ status: 'open', viewer: 'rob' }));
            cta().click();
            expect(modal.open).toHaveBeenCalledWith(WishReservation);
            expect(popup.componentInstance.wish).toBe(component.wish);
        });

        it('Verwijder reservatie opens the popup to change the reservation', async () => {
            await show(makeWish({ status: 'reserved', reservedBy: rob, viewer: 'rob' }));
            cta().click();
            expect(modal.open).toHaveBeenCalledWith(ChangeWishReservation);
        });

        it('delete opens the confirmation', async () => {
            await show(makeWish({ status: 'open', viewer: 'ria' }));
            component.delete();
            expect(modal.open).toHaveBeenCalledWith(WishDelete);
        });

        it('edit: popup in edit mode, and after saving the wish is updated', async () => {
            vi.spyOn(console, 'info').mockReturnValue(undefined);
            const wish = makeWish({ status: 'open', viewer: 'ria' });
            const draft = toDraft(wish);
            popup.result = Promise.resolve(draft);
            wishService.update.mockReturnValue(of(wish));
            await show(wish);
            component.edit();
            await vi.advanceTimersByTimeAsync(0);
            expect(modal.open).toHaveBeenCalledWith(WishPopup);
            expect(popup.componentInstance.mode).toBe('edit');
            expect(wishService.update).toHaveBeenCalledWith(wish, draft);
        });

        it('copy: popup in copy mode with this wish, then created on the list of the logged-in user', async () => {
            const original = makeWish({ status: 'open', viewer: 'rob' });
            const draft = { ...toDraft(original), copyOf: 'w1' };
            popup.result = Promise.resolve(draft);
            wishService.create.mockReturnValue(of(makeWish({ status: 'open', viewer: 'rob' })));
            await show(original);
            component.copy();
            await vi.advanceTimersByTimeAsync(0);
            expect(popup.componentInstance.mode).toBe('copy');
            expect(popup.componentInstance.wish).toBe(original);
            expect(wishService.create).toHaveBeenCalledWith(draft, 'rob');
            expect(notifications.showNotification).toHaveBeenCalledWith("De wens 'Boek' werd toegevoegd aan je lijst.", 'success', 'Wens gekopieerd');
        });

        it('feedback: confirms the gift in one call; the server mails the giver and puts the wish back on the list', async () => {
            const wish = makeWish({ status: 'received', reservedBy: rob, viewer: 'ria' });
            const feedback = { satisfaction: 5, receivedOn: '2026-12-25', message: 'Merci!', putBackOnList: true };
            popup.result = Promise.resolve(feedback);
            wishService.fulfill.mockReturnValue(of(wish));
            await show(wish);
            cta().click();
            await vi.advanceTimersByTimeAsync(0);
            expect(modal.open).toHaveBeenCalledWith(GiftFeedback);
            expect(wishService.fulfill).toHaveBeenCalledWith(wish, feedback);
        });

        it('feedback-popup weggeklikt: niets bevestigd', async () => {
            const wish = makeWish({ status: 'received', reservedBy: rob, viewer: 'ria' });
            popup.result = Promise.reject('Cancel');
            popup.result.catch((): void => undefined);   // no unhandled rejection before the component listens
            await show(wish);
            cta().click();
            await vi.advanceTimersByTimeAsync(0);
            expect(wishService.fulfill).not.toHaveBeenCalled();
        });
    });
});
