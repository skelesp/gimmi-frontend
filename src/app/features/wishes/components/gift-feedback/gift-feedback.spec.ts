import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgbActiveModal, NgbRating } from '@ng-bootstrap/ng-bootstrap';

import { Person } from 'src/app/features/people/models/person.model';
import { Wish } from '../../models/wish.model';
import { GiftFeedback } from './gift-feedback';

// Feedbackpopup bij een ontvangen cadeau.
describe('GiftFeedback', () => {
    const ria = new Person('ria', 'Ria', 'Receiver');
    const rob = new Person('rob', 'Rob', 'Reservator');
    let fixture: ComponentFixture<GiftFeedback>;
    let activeModal: Record<string, any>;

    function el(): HTMLElement { return fixture.nativeElement; }
    function opslaan(): HTMLButtonElement { return el().querySelector('.modal-footer .btn-danger'); }
    function rate(waarde: number) { fixture.debugElement.query(By.directive(NgbRating)).triggerEventHandler('rateChange', waarde); }
    async function typ(selector: string, waarde: string) {
        const veld = el().querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
        veld.value = waarde;
        veld.dispatchEvent(new Event('input'));
        await fixture.whenStable();
    }

    beforeEach(async () => {
        activeModal = { close: vi.fn(), dismiss: vi.fn() };
        await TestBed.configureTestingModule({
            imports: [GiftFeedback],
            providers: [{ provide: NgbActiveModal, useValue: activeModal }]
        }).compileComponents();
        fixture = TestBed.createComponent(GiftFeedback);
        const wish = new Wish('w1', 'Fiets', 250, null, ria, ria, null, null, null, 1);
        wish.reservation = { reservedBy: rob, reservationDate: new Date('2026-03-05T12:00:00Z') } as any;
        fixture.componentInstance.wish = wish;
        await fixture.whenStable();
    });

    it('vermeldt wie het cadeau gaf en vult de datum in met de reservatiedatum', () => {
        expect(el().querySelector('.alert').textContent).toContain('Je kreeg het cadeau "Fiets" van Rob Reservator');
        expect(el().querySelector<HTMLInputElement>('#receivedOn').value).toBe('2026-03-05');
    });

    it('opslaan kan pas met een tevredenheid', async () => {
        expect(opslaan().disabled).toBe(true);
        rate(4);
        await fixture.whenStable();
        expect(opslaan().disabled).toBe(false);
    });

    it('zonder datum kan er niet opgeslagen worden en komt er een melding', async () => {
        rate(4);
        await typ('#receivedOn', '');
        el().querySelector('#receivedOn').dispatchEvent(new Event('blur'));
        await fixture.whenStable();
        expect(opslaan().disabled).toBe(true);
        expect(el().textContent).toContain('De afgiftedatum moet ingevuld worden.');
    });

    it('een datum in de toekomst wordt geweigerd', async () => {
        rate(4);
        await typ('#receivedOn', '2999-01-01');
        el().querySelector('#receivedOn').dispatchEvent(new Event('blur'));
        await fixture.whenStable();
        expect(opslaan().disabled).toBe(true);
        expect(el().textContent).toContain('De afgiftedatum kan niet in de toekomst liggen.');
    });

    it('opslaan sluit de popup met de feedback voor API v2 (tevredenheid als getal, datum als tekst)', async () => {
        rate(5);
        await typ('#message', 'Dank!');
        el().querySelector<HTMLInputElement>('#putBackOnList').click();
        await fixture.whenStable();
        opslaan().click();
        await fixture.whenStable();
        expect(activeModal.close).toHaveBeenCalledWith({ satisfaction: 5, receivedOn: '2026-03-05', message: 'Dank!', putBackOnList: true });
    });

    it('een lege boodschap gaat als null mee', async () => {
        rate(3);
        await fixture.whenStable();
        opslaan().click();
        await fixture.whenStable();
        expect(activeModal.close).toHaveBeenCalledWith({ satisfaction: 3, receivedOn: '2026-03-05', message: null, putBackOnList: false });
    });

    it('annuleren en sluiten via het kruisje', () => {
        (el().querySelector('.btn-outline-danger') as HTMLButtonElement).click();
        expect(activeModal.dismiss).toHaveBeenCalledWith('Cancel');
        (el().querySelector('.btn-close') as HTMLButtonElement).click();
        expect(activeModal.dismiss).toHaveBeenCalledWith('Cross click');
    });
});
