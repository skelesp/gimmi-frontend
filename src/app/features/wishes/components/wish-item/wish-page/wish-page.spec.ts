import type { Mock } from 'vitest';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA, Signal, WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ImagesData } from 'src/app/features/images/images-data';
import { viewWishAs } from 'src/app/features/wishes/wish.testing';
import { Notifications } from 'src/app/core/notifications';
import { fakeAuthStore } from 'src/app/core/auth/auth-store.testing';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { Wish, WishStatus } from 'src/app/features/wishes/wish';
import type { PersonRef } from 'src/app/features/people/service/people';
import { WishesData } from 'src/app/features/wishes/wishes-data';
import { WishPage } from './wish-page';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ActionList } from '../action-list/action-list';
import { WishBanner } from '../wish-banner/wish-banner';
import { ImageView } from '../../../../images/components/image-view/image-view';
import { WishCallToActionButton } from '../wish-call-to-action-button/wish-call-to-action-button';
import { apiWish } from 'src/app/features/wishes/wish.testing';

// Detail page of a wish on /wishes/:wishId (sc-1958): shows the selected wish from
// WishesData, reuses banner, button and action list of the wish card, and follows changes.
describe('WishPage', () => {
    const ria = { id: 'ria', firstName: 'Ria', lastName: 'Receiver' };
    const rob = { id: 'rob', firstName: 'Rob', lastName: 'Reservator' };
    const carl = { id: 'carl', firstName: 'Carl', lastName: 'Creator' };

    let fixture: ComponentFixture<WishPage>;
    let component: WishPage;
    let selectedWish: WritableSignal<Wish | null>;
    let loading: WritableSignal<boolean>;
    let wishService: { selectedWish: Signal<Wish | null>; selectedLoading: Signal<boolean>; select: Mock };

    function makeWish(options: {
        status?: WishStatus;
        viewer: string;
        reservedBy?: PersonRef;
        url?: string;
        extra?: Partial<Wish>;
    }): Wish {
        const w = apiWish({
            id: 'w1', title: 'Fiets', price: { amount: 25000, currency: 'EUR' }, links: options.url ? [{ url: options.url }] : [],
            receiver: ria, createdBy: carl, status: options.status ?? 'open', createdAt: new Date(2026, 9, 3).toISOString(),
            reservation: options.reservedBy ? { reservedBy: options.reservedBy, reservedAt: new Date().toISOString(), occasion: 'birthday' } : null,
            ...options.extra
        });
        return viewWishAs(w, options.viewer);
    }

    async function show(wish: Wish) {
        selectedWish.set(wish);
        fixture = TestBed.createComponent(WishPage);
        component = fixture.componentInstance;
        await fixture.whenStable();
    }

    /** Text of the visible rows in the detail list. */
    function lines(): string[] {
        return Array.from(fixture.nativeElement.querySelectorAll('li.list-group-item') as NodeListOf<HTMLElement>)
            .filter(li => !li.hidden)
            .map(li => li.textContent.replace(/\s+/g, ' ').trim());
    }

    beforeEach(async () => {
        selectedWish = signal<Wish | null>(null);
        loading = signal(false);
        wishService = { selectedWish: selectedWish.asReadonly(), selectedLoading: loading.asReadonly(), select: vi.fn() };
        TestBed.overrideComponent(WishPage, { remove: { imports: [FaIconComponent, ActionList, WishBanner, ImageView, WishCallToActionButton] }, add: { schemas: [NO_ERRORS_SCHEMA] } });
        await TestBed.configureTestingModule({
    imports: [WishPage],
    providers: [
        provideRouter([]),
        { provide: WishesData, useValue: wishService },
        { provide: NgbModal, useValue: {
                open: vi.fn().mockName("NgbModal.open")
            } },
        { provide: Notifications, useValue: {} },
        { provide: AuthStore, useValue: fakeAuthStore() },
        { provide: ImagesData, useValue: {} },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ wishId: 'w1' })) } }
    ],
    schemas: [NO_ERRORS_SCHEMA]
}).compileComponents();
    });

    it('shows title, recipient, price and a link back to the list', async () => {
        await show(makeWish({ viewer: 'rob' }));
        const el: HTMLElement = fixture.nativeElement;
        expect(el.querySelector('h2').textContent).toBe('Fiets');
        expect(el.querySelector('h6').textContent).toContain('voor Ria Receiver');
        expect(el.querySelector('.text-bg-warning').textContent).toContain('250.00');
        const back = el.querySelector('a.text-bg-secondary');
        expect(back.textContent).toContain('Terug naar lijst');
        expect(back.getAttribute('href')).toBe('/people/ria');
    });

    it('sets the tab title to the title of the wish', async () => {
        await show(makeWish({ viewer: 'rob' }));
        expect(TestBed.inject(Title).getTitle()).toContain('| Fiets');
    });

    it('open wish of someone else: date, creator, not reserved yet; empty fields hidden', async () => {
        await show(makeWish({ viewer: 'rob' }));
        expect(lines()).toEqual(['Toegevoegd op: 03/10/26', 'Idee van: Carl Creator', 'Nog niet gereserveerd']);
    });

    it('colour, size, description and external website appear when they are filled in', async () => {
        await show(makeWish({ viewer: 'rob', url: 'www.voorbeeld.be', extra: { color: 'rood', size: 'L', description: 'Met bel' } }));
        expect(lines()).toEqual(expect.arrayContaining(['Externe website', 'rood', 'L', 'Met bel']));
        expect(fixture.nativeElement.querySelector('a[target="_blank"]').getAttribute('href')).toBe('http://www.voorbeeld.be');
    });

    it('reserved by someone else: who reserved, without button', async () => {
        await show(makeWish({ viewer: 'carl', status: 'reserved', reservedBy: rob }));
        expect(component.presentation().bannerConfig.text).toBe('Gereserveerd');
        expect(lines()).toContain('Gereserveerd door: Rob Reservator');
        expect(lines()).not.toContain('Nog niet gereserveerd');
    });

    it('reserved, viewed by the recipient: incognito, the reservation stays hidden', async () => {
        await show(makeWish({ viewer: 'ria', status: 'reserved', reservedBy: rob }));
        expect(component.presentation().bannerConfig.text).toBeNull();
        expect(lines()).toContain('Nog niet gereserveerd');
        expect(lines().join()).not.toContain('Rob');
    });

    it('closed wish: closing date', async () => {
        await show(makeWish({ viewer: 'rob', status: 'fulfilled', reservedBy: rob,
            extra: { fulfillment: { receivedOn: '2026-10-05', givenBy: null, satisfaction: 5, message: null, relistedWishId: null, fulfilledAt: new Date(2026, 9, 5).toISOString() } } }));
        expect(lines()).toContain('Afgesloten op: 05 / 10 / 26');
    });

    it('passes on banner and button of the scenario, as on the wish card', async () => {
        await show(makeWish({ viewer: 'rob', status: 'reserved', reservedBy: rob }));
        const banner = fixture.debugElement.query(el => el.name === 'gimmi-wish-banner').nativeElement;
        const cta = fixture.debugElement.query(el => el.name === 'gimmi-wish-call-to-action-button').nativeElement;
        expect(banner.bannerConfig.text).toBe('Gereserveerd door jou');
        expect(cta.CTAconfig.text).toBe('Verwijder reservatie');
    });

    it('action list for the recipient: edit and delete, not copy', async () => {
        await show(makeWish({ viewer: 'ria' }));
        expect(component.wishActionItems.map(a => a.text)).toEqual(['Aanpassen', 'Verwijderen']);
        expect(fixture.debugElement.query(el => el.name === 'gimmi-action-list').nativeElement.actionListItems)
            .toBe(component.wishActionItems);
    });

    it('requests the wish from the route', async () => {
        await show(makeWish({ viewer: 'rob' }));
        expect(wishService.select).toHaveBeenCalledWith('w1');
    });

    it('while the wish loads: a spinner, no wish', async () => {
        loading.set(true);
        fixture = TestBed.createComponent(WishPage);
        await fixture.whenStable();
        expect(fixture.nativeElement.querySelector('.spinner-border')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('h2')).toBeNull();
    });

    it('a wish that does not exist: a notice', async () => {
        fixture = TestBed.createComponent(WishPage);
        await fixture.whenStable();
        expect(fixture.nativeElement.textContent).toContain('deze wens werd niet gevonden');
        expect(fixture.nativeElement.querySelector('.spinner-border')).toBeNull();
    });

    it('follows the selected wish: a change (e.g. a reservation) is visible right away', async () => {
        await show(makeWish({ viewer: 'rob' }));
        const changed = makeWish({ viewer: 'rob', extra: { title: 'Fiets met mand' } });
        selectedWish.set(changed);
        await fixture.whenStable();
        expect(component.wish).toBe(changed);
        expect(fixture.nativeElement.querySelector('h2').textContent).toBe('Fiets met mand');
    });
});
