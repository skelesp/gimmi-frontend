import type { Mock } from 'vitest';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal, NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';

import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { Wish } from 'src/app/features/wishes/wish';
import { WishesData } from 'src/app/features/wishes/wishes-data';
import { WishPopup } from './wish-popup';
import { ImageUpload } from '../../../../images/components/image-upload/image-upload';
import { ImageView } from '../../../../images/components/image-view/image-view';
import { apiWish } from 'src/app/features/wishes/wish.testing';

// Popup om een wens toe te voegen, aan te passen of te kopiëren (sc-2348). Sluit met de
// ingevulde wens. Een opgeladen afbeelding heeft meteen een eigen sleutel in R2 (sc-2911):
// geen tijdelijke naam meer die de popup zelf moet opruimen.
describe('WishPopup', () => {
    const ria = { id: 'ria', firstName: 'Ria', lastName: 'Receiver' };
    let fixture: ComponentFixture<WishPopup>;
    let component: WishPopup;
    let activeModal: Record<string, Mock>;
    let wishService: Record<string, Mock>;

    function bestaandeWens(): Wish {
        const w = apiWish({ id: 'w1', title: 'Fiets', price: { amount: 25000, currency: 'EUR' }, links: [{ url: 'www.fiets.be' }], receiver: ria, createdBy: ria, color: 'rood', size: 'L', description: 'Met bel' });
        w.image = { key: 'wishes/w1.jpg', url: 'https://img-test.gimmi.be/wishes/w1.jpg' };
        return w;
    }

    async function open(mode: 'edit' | 'create' | 'copy' | undefined, wens?: Wish) {
        fixture = TestBed.createComponent(WishPopup);
        component = fixture.componentInstance;
        if (wens)
            component.wish = wens;
        component.mode = mode;
        await fixture.whenStable();
    }

    function veld(id: string): HTMLInputElement {
        return fixture.nativeElement.querySelector('#' + id);
    }

    function opslaan(): HTMLButtonElement {
        return fixture.nativeElement.querySelector('button[type="submit"]');
    }

    beforeEach(async () => {
        activeModal = {
            close: vi.fn().mockName("NgbActiveModal.close"),
            dismiss: vi.fn().mockName("NgbActiveModal.dismiss")
        };
        wishService = {};
        TestBed.overrideComponent(WishPopup, { remove: { imports: [ImageUpload, ImageView] }, add: { schemas: [NO_ERRORS_SCHEMA] } });
        await TestBed.configureTestingModule({
    imports: [NgbAlertModule, WishPopup],
    providers: [
        { provide: NgbActiveModal, useValue: activeModal },
        { provide: AuthStore, useValue: fakeAuthStore(testUser({ id: 'ria', firstName: 'Ria', lastName: 'Receiver', fullName: 'Ria Receiver', email: 'ria@gimmi.be' })) },
        { provide: WishesData, useValue: wishService }
    ],
    schemas: [NO_ERRORS_SCHEMA]
}).compileComponents();
    });

    it('titel en knoptekst per modus', async () => {
        const verwacht: [
            WishPopup['mode'] | undefined,
            string,
            string
        ][] = [
            ['create', 'Voeg een wens toe', 'Wens toevoegen'],
            ['edit', 'Pas deze wens aan', 'Wens aanpassen'],
            ['copy', 'Kopieer deze wens op je lijst', 'Wens kopiëren'],
            [undefined, 'Pas deze wens aan', 'Wens opslaan']
        ];
        for (const [mode, titel, knop] of verwacht) {
            await open(mode, bestaandeWens());
            expect(fixture.nativeElement.querySelector('.modal-title').textContent).toBe(titel);
            expect(opslaan().textContent).toBe(knop);
            fixture.destroy();
        }
    });

    it('aanpassen: het formulier staat ingevuld met de bestaande wens', async () => {
        await open('edit', bestaandeWens());
        expect(veld('wishTitle').value).toBe('Fiets');
        expect(veld('WishPrice').value).toBe('250');
        expect(veld('WishUrl').value).toBe('http://www.fiets.be');
        expect(veld('wishColor').value).toBe('rood');
        expect(veld('WishSize').value).toBe('L');
        expect(veld('wishDescription').value).toBe('Met bel');
    });

    it('nieuwe wens: titel is verplicht, opslaan pas mogelijk met een titel', async () => {
        await open('create');
        expect(fixture.nativeElement.textContent).toContain('Titel is een verplicht veld');
        expect(opslaan().disabled).toBe(true);

        veld('wishTitle').value = 'Boek';
        veld('wishTitle').dispatchEvent(new Event('input'));
        await fixture.whenStable();
        expect(fixture.nativeElement.textContent).not.toContain('Titel is een verplicht veld');
        expect(opslaan().disabled).toBe(false);
    });

    it('opslaan sluit de popup met de wens en de aangepaste velden', async () => {
        const wens = bestaandeWens();
        await open('edit', wens);
        veld('wishTitle').value = 'Elektrische fiets';
        veld('wishTitle').dispatchEvent(new Event('input'));
        await fixture.whenStable();
        opslaan().click();
        await fixture.whenStable();

        const resultaat = vi.mocked(activeModal.close).mock.lastCall[0];
        expect(resultaat.copyOf).toBeNull();
        expect(resultaat.title).toBe('Elektrische fiets');
        expect(resultaat.color).toBe('rood');
        expect(component.saving).toBe(true);
    });

    it('een nieuw opgeladen afbeelding komt in het formulier en in de bewaarde wens', async () => {
        await open('create');
        const nieuw = { key: 'wishes/a.jpg', url: 'u' };
        fixture.debugElement.query(el => el.name === 'gimmi-image-upload').triggerEventHandler('imageUploaded', nieuw);
        expect(component.image()).toBe(nieuw);
    });

    it('de voorvertoning van een net gekozen afbeelding gaat meteen naar de preview (sc-3028)', async () => {
        await open('create');
        expect(fixture.debugElement.query(el => el.name === 'gimmi-image-view').properties.preview).toBeNull();
        fixture.debugElement.query(el => el.name === 'gimmi-image-upload').triggerEventHandler('previewChanged', 'data:image/jpeg;base64,AAA');
        await fixture.whenStable();
        expect(component.imagePreview).toBe('data:image/jpeg;base64,AAA');
        expect(fixture.debugElement.query(el => el.name === 'gimmi-image-view').properties.preview).toBe('data:image/jpeg;base64,AAA');
    });

    it('de afbeeldingskiezer krijgt de titel als zoekterm, het voorbeeld een vaste breedte', async () => {
        await open('edit', bestaandeWens());
        expect(fixture.debugElement.query(el => el.name === 'gimmi-image-upload').properties.searchTerm).toBe('Fiets');
        expect(fixture.debugElement.query(el => el.name === 'gimmi-image-view').attributes.sizes).toBe('200px');
    });

    it('annuleren en het kruisje sluiten de popup zonder wens', async () => {
        await open('create');
        fixture.nativeElement.querySelector('.modal-footer .btn-outline-danger').click();
        expect(activeModal.dismiss).toHaveBeenCalledWith('Cancel');
        fixture.nativeElement.querySelector('button.btn-close').click();
        expect(activeModal.dismiss).toHaveBeenCalledWith('Cross click');
        expect(activeModal.close).not.toHaveBeenCalled();
    });

    it('kopiëren: waarschuwing als de server zegt dat er al een kopie van deze wens op de lijst staat', async () => {
        const kopie = { ...bestaandeWens(), id: undefined, copyOf: 'origineel', viewer: { ownCopyId: 'k1' } } as unknown as Wish;
        await open('copy', kopie);
        expect(fixture.nativeElement.querySelector('ngb-alert').textContent).toContain('er staat al een kopie van deze wens op je lijst');
    });

    it('kopiëren zonder eerdere kopie, of een andere modus: geen waarschuwing', async () => {
        await open('copy', { ...bestaandeWens(), copyOf: 'origineel', viewer: { ownCopyId: null } } as unknown as Wish);
        expect(fixture.nativeElement.querySelector('ngb-alert')).toBeNull();
        fixture.destroy();
        await open('edit', { ...bestaandeWens(), viewer: { ownCopyId: 'k1' } } as unknown as Wish);
        expect(fixture.nativeElement.querySelector('ngb-alert')).toBeNull();
    });

    it('aanpassen met een nieuwe afbeelding: de nieuwe sleutel gaat mee in de bewaarde wens', async () => {
        await open('edit', bestaandeWens());
        component.updateWishImage({ key: 'wishes/b.jpg', url: 'u' });
        await component.saveWish();
        expect(vi.mocked(activeModal.close).mock.lastCall[0].image).toEqual({ key: 'wishes/b.jpg', url: 'u' });
    });

    it('kopiëren: de beschrijving van het origineel wordt niet overgenomen en het concept verwijst naar het origineel', async () => {
        await open('copy', bestaandeWens());
        expect(veld('wishDescription').value).toBe('');
        await component.saveWish();
        const concept = vi.mocked(activeModal.close).mock.lastCall[0];
        expect(concept.copyOf).toBe('w1');
        expect(concept.title).toBe('Fiets');
        expect(concept.price).toBe(250);
        expect(concept.image).toEqual({ key: 'wishes/w1.jpg', url: 'https://img-test.gimmi.be/wishes/w1.jpg' });
    });

    it('nieuwe wens zonder prijs en afbeelding: een concept met lege prijs en zonder afbeelding', async () => {
        await open('create');
        veld('wishTitle').value = 'Boek';
        veld('wishTitle').dispatchEvent(new Event('input'));
        await fixture.whenStable();
        await component.saveWish();
        expect(vi.mocked(activeModal.close).mock.lastCall[0]).toMatchObject({ title: 'Boek', price: null, url: '', image: null, copyOf: null });
    });

    it('de prijs mag een komma hebben; tekst als prijs is ongeldig', async () => {
        await open('create');
        veld('wishTitle').value = 'Boek';
        veld('wishTitle').dispatchEvent(new Event('input'));
        veld('WishPrice').value = '12,5';
        veld('WishPrice').dispatchEvent(new Event('input'));
        await fixture.whenStable();
        await component.saveWish();
        expect(vi.mocked(activeModal.close).mock.lastCall[0].price).toBe(12.5);

        veld('WishPrice').value = 'veel';
        veld('WishPrice').dispatchEvent(new Event('input'));
        await fixture.whenStable();
        expect(fixture.nativeElement.textContent).toContain('Geef een geldige prijs in');
        expect(opslaan().disabled).toBe(true);
    });
});
