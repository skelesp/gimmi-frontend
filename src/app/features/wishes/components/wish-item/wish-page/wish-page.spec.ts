import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA, WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ImagesData } from 'src/app/features/images/images-data';
import { Person } from 'src/app/features/people/models/person.model';
import { viewWishAs } from '../../../models/wish-from-api.testing';
import { Notifications } from 'src/app/core/notifications';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { Wish, wishStatus } from 'src/app/features/wishes/models/wish.model';
import { WishesData } from 'src/app/features/wishes/wishes-data';
import { WishPage } from './wish-page';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ActionList } from '../action-list/action-list';
import { WishBanner } from '../wish-banner/wish-banner';
import { ImageView } from '../../../../images/components/image-view/image-view';
import { WishCallToActionButton } from '../wish-call-to-action-button/wish-call-to-action-button';

// Detailpagina van een wens op /wishes/:wishId (sc-1958): toont de geselecteerde wens uit de
// WishesData, hergebruikt banner, knop en actielijst van de wenskaart, en volgt wijzigingen.
describe('WishPage', () => {
    const ria = new Person('ria', 'Ria', 'Receiver');
    const rob = new Person('rob', 'Rob', 'Reservator');
    const carl = new Person('carl', 'Carl', 'Creator');

    let fixture: ComponentFixture<WishPage>;
    let component: WishPage;
    let selectedWish: WritableSignal<Wish | null>;

    function maakWens(opties: {
        status?: wishStatus;
        viewer: string;
        reservedBy?: Person;
        url?: string;
        extra?: Partial<Wish>;
    }): Wish {
        const w = new Wish('w1', 'Fiets', 250, opties.url ?? null, ria, carl, null, null, null, 1);
        w.status = opties.status ?? 'Open';
        w.createdAt = new Date(2026, 9, 3);
        if (opties.reservedBy)
            w.reservation = { reservedBy: opties.reservedBy, amount: 1, reservationDate: new Date(), reason: 'Verjaardag' };
        Object.assign(w, opties.extra ?? {});
        viewWishAs(w, opties.viewer);
        return w;
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
        TestBed.overrideComponent(WishPage, { remove: { imports: [FaIconComponent, ActionList, WishBanner, ImageView, WishCallToActionButton] }, add: { schemas: [NO_ERRORS_SCHEMA] } });
        await TestBed.configureTestingModule({
    imports: [WishPage],
    providers: [
        provideRouter([]),
        { provide: WishesData, useValue: { selectedWish: selectedWish.asReadonly() } },
        { provide: NgbModal, useValue: {
                open: vi.fn().mockName("NgbModal.open")
            } },
        { provide: Notifications, useValue: {} },
        { provide: AuthStore, useValue: fakeAuthStore() },
        { provide: ImagesData, useValue: {} },
        { provide: ActivatedRoute, useValue: {} }
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
        await toon(maakWens({ viewer: 'carl', status: 'Reserved', reservedBy: rob }));
        expect(component.presentation().bannerConfig.text).toBe('Gereserveerd');
        expect(regels()).toContain('Gereserveerd door: Rob Reservator');
        expect(regels()).not.toContain('Nog niet gereserveerd');
    });

    it('gereserveerd, bekeken door de ontvanger: incognito, de reservatie blijft verborgen', async () => {
        await toon(maakWens({ viewer: 'ria', status: 'Reserved', reservedBy: rob }));
        expect(component.presentation().bannerConfig.text).toBeNull();
        expect(regels()).toContain('Nog niet gereserveerd');
        expect(regels().join()).not.toContain('Rob');
    });

    it('afgesloten wens: afsluitdatum', async () => {
        await toon(maakWens({ viewer: 'rob', status: 'Fulfilled', reservedBy: rob,
            extra: { closure: { closedBy: ria, closedOn: new Date(2026, 9, 5), reason: 'Ontvangen' } as any } }));
        expect(regels()).toContain('Afgesloten op: 05 / 10 / 26');
    });

    it('geeft banner en knop van het scenario door, zoals op de wenskaart', async () => {
        await toon(maakWens({ viewer: 'rob', status: 'Reserved', reservedBy: rob }));
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

    it('volgt de geselecteerde wens: een wijziging (bv. een reservatie) is meteen zichtbaar', async () => {
        await toon(maakWens({ viewer: 'rob' }));
        const gewijzigd = maakWens({ viewer: 'rob', extra: { title: 'Fiets met mand' } });
        selectedWish.set(gewijzigd);
        await fixture.whenStable();
        expect(component.wish).toBe(gewijzigd);
        expect(fixture.nativeElement.querySelector('h2').textContent).toBe('Fiets met mand');
    });
});
