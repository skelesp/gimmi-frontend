import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Person } from 'src/app/people/models/person.model';
import { Wish } from '../../models/wish.model';
import { GiftFeedback } from './gift-feedback';

// Feedbackpopup bij een ontvangen cadeau.
describe('GiftFeedback', () => {
    const ria = new Person('ria', 'Ria', 'Receiver');
    const rob = new Person('rob', 'Rob', 'Reservator');
    let fixture: ComponentFixture<GiftFeedback>;
    let activeModal: Record<string, any>;

    function el(): HTMLElement { return fixture.nativeElement; }

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
        expect(fixture.componentInstance.giftFeedbackForm.value.receivedOn).toBe('2026-03-05');
    });

    it('opslaan kan pas met een tevredenheid', async () => {
        const knop = el().querySelector('.modal-footer .btn-danger') as HTMLButtonElement;
        expect(knop.disabled).toBe(true);
        fixture.componentInstance.giftFeedbackForm.patchValue({ satisfaction: 4 });
        await fixture.whenStable();
        expect(knop.disabled).toBe(false);
    });

    it('opslaan sluit de popup met de feedback en de tekst van de tevredenheid', () => {
        fixture.componentInstance.giftFeedbackForm.patchValue({ satisfaction: 5, message: 'Dank!', putBackOnList: true });
        fixture.componentInstance.saveGiftFeedback();
        expect(activeModal.close).toHaveBeenCalledWith({ satisfaction: 'Heel blij', receivedOn: new Date('2026-03-05'), message: 'Dank!', putBackOnList: true });
    });

    it('annuleren en sluiten via het kruisje', () => {
        (el().querySelector('.btn-outline-danger') as HTMLButtonElement).click();
        expect(activeModal.dismiss).toHaveBeenCalledWith('Cancel');
        (el().querySelector('.btn-close') as HTMLButtonElement).click();
        expect(activeModal.dismiss).toHaveBeenCalledWith('Cross click');
    });
});
