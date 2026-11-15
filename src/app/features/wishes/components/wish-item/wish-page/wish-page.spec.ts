import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA, WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ImagesData } from 'src/app/features/images/images-data';
import { viewWishAs } from 'src/app/features/wishes/wish.testing';
import { Notifications } from 'src/app/core/notifications';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
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

// Detailpagina van een wens op /wishes/:wishId (sc-1958): toont de geselecteerde wens uit de
// WishesData, hergebruikt banner, knop en actielijst van de wenskaart, en volgt wijzigingen.
describe('WishPage', () => {
    const ria = { id: 'ria', firstName: 'Ria', lastName: 'Receiver' };
    const rob = { id: 'rob', firstName: 'Rob', lastName: 'Reservator' };
    const carl = { id: 'carl', firstName: 'Carl', lastName: 'Creator' };

    let fixture: ComponentFixture<WishPage>;
    let component: WishPage;
    let selectedWish: WritableSignal<Wish | null>;
    let loading: WritableSignal<boolean>;
    let wishService: { selectedWish: any; selectedLoading: any; select: ReturnType<typeof vi.fn> };

    function maakWens(opties: {
        status?: WishStatus;
        viewer: string;
        reservedBy?: PersonRef;
        url?: string;
        extra?: Partial<Wish>;
    }): Wish {
        const w = apiWish({
            id: 'w1', title: 'Fiets', price: { amount: 25000, currency: 'EUR' }, links: opties.url ? [{ url: opties.url }] : [],
            receiver: ria, createdBy: carl, status: opties.status ?? 'open', createdAt: new Date(2026, 9, 3).toISOString(),
            reservation: opties.reservedBy ? { reservedBy: opties.reservedBy, reservedAt: new Date().toISOString(), occasion: 'birthday' } : null,
            ...opties.extra
        });
        return viewWishAs(w, opties.viewer);
    }

    async function toon(wens: Wish) {
        selectedWish.set(wens);
        fixture = TestBed.createComponent(WishPage);
        component = fixture.componentInstance;
        await fixture.whenStable();
    }

    /** Tekst van de zichtbare regels in de detaillijst. */
    function regels(): string[] {
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

    it('toont titel, ontvanger, prijs en een link terug naar de lijst', async () => {
        await toon(maakWens({ viewer: 'rob' }));
        const el: HTMLElement = fixture.nativeElement;
        expect(el.querySelector('h2').textContent).toBe('Fiets');
        expect(el.querySelector('h6').textContent).toContain('voor Ria Receiver');
        expect(el.querySelector('.text-bg-warning').textContent).toContain('250.00');
        const terug = el.querySelector('a.text-bg-secondary');
        expect(terug.textContent).toContain('Terug naar lijst');
        expect(terug.getAttribute('href')).toBe('/people/ria');
    });

    it('open wens bij een ander: datum, maker, nog niet gereserveerd; lege velden verborgen', async () => {
        await toon(maakWens({ viewer: 'rob' }));
        expect(regels()).toEqual(['Toegevoegd op: 03/10/26', 'Idee van: Carl Creator', 'Nog niet gereserveerd']);
    });

    it('kleur, maat, beschrijving en externe website verschijnen als ze ingevuld zijn', async () => {
        await toon(maakWens({ viewer: 'rob', url: 'www.voorbeeld.be', extra: { color: 'rood', size: 'L', description: 'Met bel' } }));
        expect(regels()).toEqual(expect.arrayContaining(['Externe website', 'rood', 'L', 'Met bel']));
        expect(fixture.nativeElement.querySelector('a[target="_blank"]').getAttribute('href')).toBe('http://www.voorbeeld.be');
    });

    it('gereserveerd door een ander: wie reserveerde, zonder knop', async () => {
        await toon(maakWens({ viewer: 'carl', status: 'reserved', reservedBy: rob }));
        expect(component.presentation().bannerConfig.text).toBe('Gereserveerd');
        expect(regels()).toContain('Gereserveerd door: Rob Reservator');
        expect(regels()).not.toContain('Nog niet gereserveerd');
    });

    it('gereserveerd, bekeken door de ontvanger: incognito, de reservatie blijft verborgen', async () => {
        await toon(maakWens({ viewer: 'ria', status: 'reserved', reservedBy: rob }));
        expect(component.presentation().bannerConfig.text).toBeNull();
        expect(regels()).toContain('Nog niet gereserveerd');
        expect(regels().join()).not.toContain('Rob');
    });

    it('afgesloten wens: afsluitdatum', async () => {
        await toon(maakWens({ viewer: 'rob', status: 'fulfilled', reservedBy: rob,
            extra: { fulfillment: { receivedOn: '2026-10-05', givenBy: null, satisfaction: 5, message: null, relistedWishId: null, fulfilledAt: new Date(2026, 9, 5).toISOString() } } }));
        expect(regels()).toContain('Afgesloten op: 05 / 10 / 26');
    });

    it('geeft banner en knop van het scenario door, zoals op de wenskaart', async () => {
        await toon(maakWens({ viewer: 'rob', status: 'reserved', reservedBy: rob }));
        const banner = fixture.debugElement.query(el => el.name === 'gimmi-wish-banner').nativeElement;
        const cta = fixture.debugElement.query(el => el.name === 'gimmi-wish-call-to-action-button').nativeElement;
        expect(banner.bannerConfig.text).toBe('Gereserveerd door jou');
        expect(cta.CTAconfig.text).toBe('Verwijder reservatie');
    });

    it('actielijst voor de ontvanger: aanpassen en verwijderen, niet kopiëren', async () => {
        await toon(maakWens({ viewer: 'ria' }));
        expect(component.wishActionItems.map(a => a.text)).toEqual(['Aanpassen', 'Verwijderen']);
        expect(fixture.debugElement.query(el => el.name === 'gimmi-action-list').nativeElement.actionListItems)
            .toBe(component.wishActionItems);
    });

    it('vraagt de wens uit de route', async () => {
        await toon(maakWens({ viewer: 'rob' }));
        expect(wishService.select).toHaveBeenCalledWith('w1');
    });

    it('terwijl de wens laadt: een spinner, geen wens', async () => {
        loading.set(true);
        fixture = TestBed.createComponent(WishPage);
        await fixture.whenStable();
        expect(fixture.nativeElement.querySelector('.spinner-border')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('h2')).toBeNull();
    });

    it('een wens die niet bestaat: een melding', async () => {
        fixture = TestBed.createComponent(WishPage);
        await fixture.whenStable();
        expect(fixture.nativeElement.textContent).toContain('deze wens werd niet gevonden');
        expect(fixture.nativeElement.querySelector('.spinner-border')).toBeNull();
    });

    it('volgt de geselecteerde wens: een wijziging (bv. een reservatie) is meteen zichtbaar', async () => {
        await toon(maakWens({ viewer: 'rob' }));
        const gewijzigd = maakWens({ viewer: 'rob', extra: { title: 'Fiets met mand' } });
        selectedWish.set(gewijzigd);
        await fixture.whenStable();
        expect(component.wish).toBe(gewijzigd);
        expect(fixture.nativeElement.querySelector('h2').textContent).toBe('Fiets met mand');
    });
});
