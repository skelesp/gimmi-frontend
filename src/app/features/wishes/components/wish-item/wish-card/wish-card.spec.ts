import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';

import { ImagesData } from 'src/app/features/images/images-data';
import { Person } from 'src/app/features/people/models/person.model';
import { viewWishAs } from '../../../models/wish-from-api.testing';
import { Notifications } from 'src/app/core/notifications';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { Wish, wishStatus } from '../../../models/wish.model';
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

// Wat een wenskaart toont per scenario (sc-1955, sc-1960, sc-2446, sc-2453, sc-2558, sc-2566) en
// welke acties ze aanbiedt (sc-1978, sc-1982). Logica komt uit WishItem.
describe('WishCard', () => {
    beforeEach(() => {
        vi.useFakeTimers({ advanceTimeDelta: 1, shouldAdvanceTime: true });
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    const ria = new Person('ria', 'Ria', 'Receiver');
    const rob = new Person('rob', 'Rob', 'Reservator');
    const carl = new Person('carl', 'Carl', 'Creator');

    let fixture: ComponentFixture<WishCard>;
    let component: WishCard;
    let modal: Record<string, any>;
    let wishService: Record<string, any>;
    let images: Record<string, any>;
    let notifications: Record<string, any>;
    let popup: {
        componentInstance: any;
        result: Promise<any>;
    };

    function maakWens(opties: {
        status: wishStatus;
        createdBy?: Person;
        reservedBy?: Person;
        url?: string;
        viewer: string;
    }): Wish {
        const w = new Wish('w1', 'Boek', 20, opties.url ?? null, ria, opties.createdBy ?? ria, null, null, null, 1);
        w.status = opties.status;
        if (opties.reservedBy)
            w.reservation = { reservedBy: opties.reservedBy, amount: 1, reservationDate: null, reason: null };
        viewWishAs(w, opties.viewer);
        return w;
    }

    async function toon(wens: Wish) {
        fixture = TestBed.createComponent(WishCard);
        component = fixture.componentInstance;
        component.wish = wens;
        await fixture.whenStable();
    }

    function banner(): string {
        return (fixture.nativeElement.querySelector('gimmi-wish-banner')?.textContent || '').trim();
    }

    function cta(): HTMLButtonElement {
        return fixture.nativeElement.querySelector('gimmi-wish-call-to-action-button button');
    }

    function geblurd(): boolean {
        return fixture.nativeElement.querySelector('.card-img-overlay').classList.contains('blurred-card-overlay');
    }

    function acties(): string[] {
        return component.wishActionItems.map(a => a.text);
    }

    beforeEach(async () => {
        popup = { componentInstance: {}, result: new Promise(() => { }) };
        modal = {
            open: vi.fn().mockName("NgbModal.open")
        };
        modal.open.mockImplementation(() => popup as any);
        wishService = {
            fulfill: vi.fn().mockName("WishesData.fulfill"),
            update: vi.fn().mockName("WishesData.update"),
            create: vi.fn().mockName("WishesData.create")
        };
        images = {
            uploadImage: vi.fn().mockName("ImagesData.uploadImage"),
            heeftBeeld: vi.fn().mockName("ImagesData.heeftBeeld")
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

    describe('banner, knop en vervaging per scenario', () => {
        const gevallen: {
            naam: string;
            wens: () => Wish;
            banner: string;
            knop: string | null;
            blur: boolean;
        }[] = [
            { naam: 'open wens van een ander', wens: () => maakWens({ status: 'Open', viewer: 'rob' }), banner: '', knop: 'Reserveer', blur: false },
            { naam: 'open wens, jouw idee voor iemand anders', wens: () => maakWens({ status: 'Open', createdBy: carl, viewer: 'carl' }), banner: 'Jouw idee', knop: 'Reserveer', blur: false },
            { naam: 'gereserveerd door een ander', wens: () => maakWens({ status: 'Reserved', reservedBy: rob, viewer: 'iemand' }), banner: 'Gereserveerd', knop: null, blur: true },
            { naam: 'gereserveerd door jou', wens: () => maakWens({ status: 'Reserved', reservedBy: rob, viewer: 'rob' }), banner: 'Gereserveerd door jou', knop: 'Verwijder reservatie', blur: true },
            { naam: 'gereserveerd, bekeken door de ontvanger (incognito)', wens: () => maakWens({ status: 'Reserved', reservedBy: rob, viewer: 'ria' }), banner: '', knop: 'Reserveer', blur: false },
            { naam: 'ontvangen, bekeken door de ontvanger', wens: () => maakWens({ status: 'Received', reservedBy: rob, viewer: 'ria' }), banner: 'Ontvangen', knop: 'Geef feedback', blur: true },
            { naam: 'ontvangen, gegeven door jou', wens: () => maakWens({ status: 'Received', reservedBy: rob, viewer: 'rob' }), banner: 'Gegeven door jou', knop: null, blur: true },
            { naam: 'ontvangen, bekeken door een derde', wens: () => maakWens({ status: 'Received', reservedBy: rob, viewer: 'iemand' }), banner: 'Ontvangen', knop: null, blur: true },
            { naam: 'vervuld', wens: () => maakWens({ status: 'Fulfilled', reservedBy: rob, viewer: 'ria' }), banner: 'Wens vervuld', knop: null, blur: true },
            { naam: 'vervuld door jou', wens: () => maakWens({ status: 'Fulfilled', reservedBy: rob, viewer: 'rob' }), banner: 'Wens vervuld door jou', knop: null, blur: true }
        ];

        gevallen.forEach(g => {
            it(g.naam, async () => {
                await toon(g.wens());
                expect(banner()).toBe(g.banner);
                if (g.knop)
                    expect(cta().textContent.trim()).toBe(g.knop);
                else
                    expect(cta()).toBeNull();
                expect(geblurd()).toBe(g.blur);
            });
        });
    });

    describe('acties in het menu', () => {
        it('eigen wens: aanpassen en verwijderen, niet kopiëren', async () => {
            await toon(maakWens({ status: 'Open', viewer: 'ria' }));
            expect(acties()).toEqual(['Aanpassen', 'Verwijderen']);
        });

        it('wens van een ander: enkel op eigen lijst zetten', async () => {
            await toon(maakWens({ status: 'Open', viewer: 'rob' }));
            expect(acties()).toEqual(['Zet op eigen lijst']);
        });

        it('idee dat je voor een ander aanmaakte: aanpassen, kopiëren en verwijderen', async () => {
            await toon(maakWens({ status: 'Open', createdBy: carl, viewer: 'carl' }));
            expect(acties()).toEqual(['Aanpassen', 'Zet op eigen lijst', 'Verwijderen']);
        });

        it('met een url: "Externe website" bovenaan, met die url', async () => {
            await toon(maakWens({ status: 'Open', viewer: 'rob', url: 'www.winkel.be' }));
            expect(acties()[0]).toBe('Externe website');
            expect(component.wishActionItems[0].url).toBe('http://www.winkel.be');
        });

        it('"Toegevoegd door" enkel als iemand anders de wens aanmaakte', async () => {
            await toon(maakWens({ status: 'Open', createdBy: carl, viewer: 'rob' }));
            expect(fixture.nativeElement.textContent).toContain('Toegevoegd door Carl C.');
            await toon(maakWens({ status: 'Open', viewer: 'rob' }));
            expect(fixture.nativeElement.textContent).not.toContain('Toegevoegd door');
        });
    });

    describe('popups', () => {
        it('Reserveer opent de reservatiepopup met deze wens', async () => {
            await toon(maakWens({ status: 'Open', viewer: 'rob' }));
            cta().click();
            expect(modal.open).toHaveBeenCalledWith(WishReservation);
            expect(popup.componentInstance.wish).toBe(component.wish);
        });

        it('Verwijder reservatie opent de popup om de reservatie te wijzigen', async () => {
            await toon(maakWens({ status: 'Reserved', reservedBy: rob, viewer: 'rob' }));
            cta().click();
            expect(modal.open).toHaveBeenCalledWith(ChangeWishReservation);
        });

        it('verwijderen opent de bevestiging', async () => {
            await toon(maakWens({ status: 'Open', viewer: 'ria' }));
            component.delete();
            expect(modal.open).toHaveBeenCalledWith(WishDelete);
        });

        it('aanpassen: popup in edit-modus, en na opslaan wordt de wens bijgewerkt', async () => {
            vi.spyOn(console, 'info').mockReturnValue(undefined);
            const wens = maakWens({ status: 'Open', viewer: 'ria' });
            popup.result = Promise.resolve(wens);
            wishService.update.mockReturnValue(of(wens));
            await toon(wens);
            component.edit();
            await vi.advanceTimersByTimeAsync(0);
            expect(modal.open).toHaveBeenCalledWith(WishPopup);
            expect(popup.componentInstance.mode).toBe('edit');
            expect(wishService.update).toHaveBeenCalledWith(wens);
        });

        it('kopiëren: popup in copy-modus met de ingelogde gebruiker als ontvanger, daarna aangemaakt', async () => {
            images.heeftBeeld.mockReturnValue(false);
            const kopie = maakWens({ status: 'Open', viewer: 'rob' });
            popup.result = Promise.resolve(kopie);
            wishService.create.mockReturnValue(of(kopie));
            await toon(maakWens({ status: 'Open', viewer: 'rob' }));
            component.copy();
            await vi.advanceTimersByTimeAsync(0);
            expect(popup.componentInstance.mode).toBe('copy');
            expect(popup.componentInstance.wish.copyOf).toBe('w1');
            expect(popup.componentInstance.wish.id).toBeUndefined();
            expect(popup.componentInstance.wish.receiver.id).toBe('rob');
            expect(wishService.create).toHaveBeenCalledWith(kopie);
            expect(notifications.showNotification).toHaveBeenCalledWith("De wens 'Boek' werd toegevoegd aan je lijst.", 'success', 'Wens gekopieerd');
            expect(popup.componentInstance.wish.image).toBeNull();
            expect(images.uploadImage).not.toHaveBeenCalled();
        });

        // Afbeelding bij het kopiëren (sc-2911).
        async function kopieer(image: any) {
            const origineel = maakWens({ status: 'Open', viewer: 'rob' });
            origineel.image = image;
            await toon(origineel);
            component.copy();
            await vi.advanceTimersByTimeAsync(0);
        }

        it('kopiëren met een R2-beeld: de kopie deelt de sleutel, niets opgeladen', async () => {
            images.heeftBeeld.mockReturnValue(true);
            await kopieer({ key: 'wishes/a.jpg', url: 'u' });
            expect(popup.componentInstance.wish.image).toEqual({ key: 'wishes/a.jpg', url: 'u' });
            expect(images.uploadImage).not.toHaveBeenCalled();
        });

        it('feedback: bevestigt het cadeau in één oproep; de server mailt de gever en zet de wens terug op de lijst', async () => {
            const wens = maakWens({ status: 'Received', reservedBy: rob, viewer: 'ria' });
            const feedback = { satisfaction: 5, receivedOn: '2026-12-25', message: 'Merci!', putBackOnList: true };
            popup.result = Promise.resolve(feedback);
            wishService.fulfill.mockReturnValue(of(wens));
            await toon(wens);
            cta().click();
            await vi.advanceTimersByTimeAsync(0);
            expect(modal.open).toHaveBeenCalledWith(GiftFeedback);
            expect(wishService.fulfill).toHaveBeenCalledWith(wens, feedback);
        });

        it('feedback-popup weggeklikt: niets bevestigd', async () => {
            const wens = maakWens({ status: 'Received', reservedBy: rob, viewer: 'ria' });
            popup.result = Promise.reject('Cancel');
            popup.result.catch(() => { });   // geen unhandled rejection vóór de component luistert
            await toon(wens);
            cta().click();
            await vi.advanceTimersByTimeAsync(0);
            expect(wishService.fulfill).not.toHaveBeenCalled();
        });
    });
});
