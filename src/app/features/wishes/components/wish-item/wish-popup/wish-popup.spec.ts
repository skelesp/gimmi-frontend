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

// Popup to add, edit or copy a wish (sc-2348). Closes with the
// filled-in wish. An uploaded image immediately has its own key in R2 (sc-2911):
// no temporary name any more that the popup has to clean up itself.
describe('WishPopup', () => {
    const ria = { id: 'ria', firstName: 'Ria', lastName: 'Receiver' };
    let fixture: ComponentFixture<WishPopup>;
    let component: WishPopup;
    let activeModal: Record<string, Mock>;
    let wishService: Record<string, Mock>;

    function existingWish(): Wish {
        const w = apiWish({ id: 'w1', title: 'Fiets', price: { amount: 25000, currency: 'EUR' }, links: [{ url: 'www.fiets.be' }], receiver: ria, createdBy: ria, color: 'rood', size: 'L', description: 'Met bel' });
        w.image = { key: 'wishes/w1.jpg', url: 'https://img-test.gimmi.be/wishes/w1.jpg' };
        return w;
    }

    async function open(mode: 'edit' | 'create' | 'copy' | undefined, wish?: Wish) {
        fixture = TestBed.createComponent(WishPopup);
        component = fixture.componentInstance;
        if (wish)
            component.wish = wish;
        component.mode = mode;
        await fixture.whenStable();
    }

    function field(id: string): HTMLInputElement {
        return fixture.nativeElement.querySelector('#' + id);
    }

    function save(): HTMLButtonElement {
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

    it('title and button text per mode', async () => {
        const expected: [
            WishPopup['mode'] | undefined,
            string,
            string
        ][] = [
            ['create', 'Voeg een wens toe', 'Wens toevoegen'],
            ['edit', 'Pas deze wens aan', 'Wens aanpassen'],
            ['copy', 'Kopieer deze wens op je lijst', 'Wens kopiëren'],
            [undefined, 'Pas deze wens aan', 'Wens opslaan']
        ];
        for (const [mode, title, button] of expected) {
            await open(mode, existingWish());
            expect(fixture.nativeElement.querySelector('.modal-title').textContent).toBe(title);
            expect(save().textContent).toBe(button);
            fixture.destroy();
        }
    });

    it('edit: the form is filled in with the existing wish', async () => {
        await open('edit', existingWish());
        expect(field('wishTitle').value).toBe('Fiets');
        expect(field('WishPrice').value).toBe('250');
        expect(field('WishUrl').value).toBe('http://www.fiets.be');
        expect(field('wishColor').value).toBe('rood');
        expect(field('WishSize').value).toBe('L');
        expect(field('wishDescription').value).toBe('Met bel');
    });

    it('new wish: title is required, saving only possible with a title', async () => {
        await open('create');
        expect(fixture.nativeElement.textContent).toContain('Titel is een verplicht veld');
        expect(save().disabled).toBe(true);

        field('wishTitle').value = 'Boek';
        field('wishTitle').dispatchEvent(new Event('input'));
        await fixture.whenStable();
        expect(fixture.nativeElement.textContent).not.toContain('Titel is een verplicht veld');
        expect(save().disabled).toBe(false);
    });

    it('saving closes the popup with the wish and the changed fields', async () => {
        const wish = existingWish();
        await open('edit', wish);
        field('wishTitle').value = 'Elektrische fiets';
        field('wishTitle').dispatchEvent(new Event('input'));
        await fixture.whenStable();
        save().click();
        await fixture.whenStable();

        const result = vi.mocked(activeModal.close).mock.lastCall[0];
        expect(result.copyOf).toBeNull();
        expect(result.title).toBe('Elektrische fiets');
        expect(result.color).toBe('rood');
        expect(component.saving).toBe(true);
    });

    it('a newly uploaded image ends up in the form and in the saved wish', async () => {
        await open('create');
        const created = { key: 'wishes/a.jpg', url: 'u' };
        fixture.debugElement.query(el => el.name === 'gimmi-image-upload').triggerEventHandler('imageUploaded', created);
        expect(component.image()).toBe(created);
    });

    it('the preview of a just-chosen image goes straight to the preview (sc-3028)', async () => {
        await open('create');
        expect(fixture.debugElement.query(el => el.name === 'gimmi-image-view').properties.preview).toBeNull();
        fixture.debugElement.query(el => el.name === 'gimmi-image-upload').triggerEventHandler('previewChanged', 'data:image/jpeg;base64,AAA');
        await fixture.whenStable();
        expect(component.imagePreview).toBe('data:image/jpeg;base64,AAA');
        expect(fixture.debugElement.query(el => el.name === 'gimmi-image-view').properties.preview).toBe('data:image/jpeg;base64,AAA');
    });

    it('the image picker gets the title as search term, the example a fixed width', async () => {
        await open('edit', existingWish());
        expect(fixture.debugElement.query(el => el.name === 'gimmi-image-upload').properties.searchTerm).toBe('Fiets');
        expect(fixture.debugElement.query(el => el.name === 'gimmi-image-view').attributes.sizes).toBe('200px');
    });

    it('cancelling and the cross close the popup without a wish', async () => {
        await open('create');
        fixture.nativeElement.querySelector('.modal-footer .btn-outline-danger').click();
        expect(activeModal.dismiss).toHaveBeenCalledWith('Cancel');
        fixture.nativeElement.querySelector('button.btn-close').click();
        expect(activeModal.dismiss).toHaveBeenCalledWith('Cross click');
        expect(activeModal.close).not.toHaveBeenCalled();
    });

    it('copy: warning if the server says there is already a copy of this wish on the list', async () => {
        const copy = { ...existingWish(), id: undefined, copyOf: 'origineel', viewer: { ownCopyId: 'k1' } } as unknown as Wish;
        await open('copy', copy);
        expect(fixture.nativeElement.querySelector('ngb-alert').textContent).toContain('er staat al een kopie van deze wens op je lijst');
    });

    it('copy without earlier copy, or another mode: no warning', async () => {
        await open('copy', { ...existingWish(), copyOf: 'origineel', viewer: { ownCopyId: null } } as unknown as Wish);
        expect(fixture.nativeElement.querySelector('ngb-alert')).toBeNull();
        fixture.destroy();
        await open('edit', { ...existingWish(), viewer: { ownCopyId: 'k1' } } as unknown as Wish);
        expect(fixture.nativeElement.querySelector('ngb-alert')).toBeNull();
    });

    it('edit with a new image: the new key is included in the saved wish', async () => {
        await open('edit', existingWish());
        component.updateWishImage({ key: 'wishes/b.jpg', url: 'u' });
        await component.saveWish();
        expect(vi.mocked(activeModal.close).mock.lastCall[0].image).toEqual({ key: 'wishes/b.jpg', url: 'u' });
    });

    it('copy: the description of the original is not taken over and the draft refers to the original', async () => {
        await open('copy', existingWish());
        expect(field('wishDescription').value).toBe('');
        await component.saveWish();
        const concept = vi.mocked(activeModal.close).mock.lastCall[0];
        expect(concept.copyOf).toBe('w1');
        expect(concept.title).toBe('Fiets');
        expect(concept.price).toBe(250);
        expect(concept.image).toEqual({ key: 'wishes/w1.jpg', url: 'https://img-test.gimmi.be/wishes/w1.jpg' });
    });

    it('new wish without price and image: a draft with empty price and without image', async () => {
        await open('create');
        field('wishTitle').value = 'Boek';
        field('wishTitle').dispatchEvent(new Event('input'));
        await fixture.whenStable();
        await component.saveWish();
        expect(vi.mocked(activeModal.close).mock.lastCall[0]).toMatchObject({ title: 'Boek', price: null, url: '', image: null, copyOf: null });
    });

    it('the price may have a comma; text as price is invalid', async () => {
        await open('create');
        field('wishTitle').value = 'Boek';
        field('wishTitle').dispatchEvent(new Event('input'));
        field('WishPrice').value = '12,5';
        field('WishPrice').dispatchEvent(new Event('input'));
        await fixture.whenStable();
        await component.saveWish();
        expect(vi.mocked(activeModal.close).mock.lastCall[0].price).toBe(12.5);

        field('WishPrice').value = 'veel';
        field('WishPrice').dispatchEvent(new Event('input'));
        await fixture.whenStable();
        expect(fixture.nativeElement.textContent).toContain('Geef een geldige prijs in');
        expect(save().disabled).toBe(true);
    });
});
