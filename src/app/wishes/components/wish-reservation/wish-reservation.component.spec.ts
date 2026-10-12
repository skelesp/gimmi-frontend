import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';

import { Person } from 'src/app/people/models/person.model';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { User } from 'src/app/users/models/user.model';
import { UserService } from 'src/app/users/service/user.service';
import { IReservation, Wish } from '../../models/wish.model';
import { WishService } from '../../services/wish.service';
import { WishReservationComponent } from './wish-reservation.component';

// Reservatiepopup met overhandigingsdatum en gelegenheid (sc-1892).
describe('WishReservationComponent', () => {
  const ria = new Person('ria', 'Ria', 'Receiver');
  let fixture: ComponentFixture<WishReservationComponent>;
  let activeModal: jasmine.SpyObj<NgbActiveModal>;
  let wishService: jasmine.SpyObj<WishService>;
  let notifications: jasmine.SpyObj<NotificationService>;

  function el(): HTMLElement { return fixture.nativeElement; }
  function knop(): HTMLButtonElement { return el().querySelector('button[type="submit"]'); }
  function reden(): HTMLSelectElement { return el().querySelector('#reservationReason'); }

  function kies(optie: string) {
    const select = reden();
    select.value = Array.from(select.options).find(o => o.textContent.trim() === optie).value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    activeModal = jasmine.createSpyObj<NgbActiveModal>('NgbActiveModal', ['close', 'dismiss']);
    wishService = jasmine.createSpyObj<WishService>('WishService', ['addReservation']);
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['showNotification']);
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [WishReservationComponent],
      providers: [
        { provide: NgbActiveModal, useValue: activeModal },
        { provide: UserService, useValue: { currentUser: new User('rob', 'Reservator', 'Rob', 'rob@gimmi.be', 'local', 't', {}) } },
        { provide: WishService, useValue: wishService },
        { provide: NotificationService, useValue: notifications }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(WishReservationComponent);
    fixture.componentInstance.wish = new Wish('w1', 'Fiets', 250, null, ria, ria, null, null, null, 1);
    fixture.detectChanges();
  });

  it('titel en uitleg met de wens en de voornaam van de ontvanger', () => {
    expect(el().querySelector('.modal-title').textContent).toContain('Reserveer Fiets');
    expect(el().textContent).toContain('Wanneer geef je het cadeau aan Ria?');
    expect(el().textContent).toContain('Je reservatie blijft onzichtbaar voor Ria tot na deze datum.');
  });

  it('overhandigingsdatum staat standaard op vandaag', () => {
    const datum: HTMLInputElement = el().querySelector('#handoverDate');
    expect(datum.type).toBe('date');
    expect(datum.value).toBe(new Date().toISOString().substring(0, 10));
  });

  it('gelegenheden in vaste volgorde', () => {
    const opties = Array.from(reden().options).filter(o => !o.hidden).map(o => o.textContent.trim());
    expect(opties).toEqual(['Verjaardag', 'Sinterklaas', 'Kerstmis', 'Nieuwjaar', 'Housewarming', 'Geboorte', 'Huwelijk',
      'Afscheid collega', 'Afscheid', 'Communie / Lentefeest', 'Vader/moederdag', 'Andere reden']);
  });

  it('gelegenheid is verplicht: knop uit en melding na aanraken', () => {
    expect(knop().disabled).toBeTrue();
    reden().dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(el().textContent).toContain('De gelegenheid is een verplicht veld.');
    kies('Kerstmis');
    expect(knop().disabled).toBeFalse();
    expect(el().textContent).not.toContain('De gelegenheid is een verplicht veld.');
  });

  it('reserveren: reservatie op naam van de ingelogde gebruiker, melding en popup dicht', () => {
    wishService.addReservation.and.callFake((w: Wish) => of(w));
    kies('Verjaardag');
    const datum: HTMLInputElement = el().querySelector('#handoverDate');
    datum.value = '2026-12-24';
    datum.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    knop().click();

    const reservatie: IReservation = wishService.addReservation.calls.mostRecent().args[1];
    expect(reservatie.reason).toBe('Verjaardag');
    expect(reservatie.handoverDate).toEqual(new Date('2026-12-24'));
    expect(reservatie.amount).toBe(1);
    expect(reservatie.reservedBy.id).toBe('rob');
    expect(reservatie.reservedBy.fullName).toBe('Rob Reservator');
    expect(notifications.showNotification).toHaveBeenCalledWith(
      'Wens Fiets is gereserveerd. U hoeft dit perfecte cadeau enkel nog te kopen en af te geven!', 'success', 'Gereserveerd');
    expect(activeModal.close).toHaveBeenCalledWith(reservatie);
  });

  it('annuleren en het kruisje: niets gereserveerd', () => {
    el().querySelector<HTMLButtonElement>('.modal-footer .btn-outline-danger').click();
    el().querySelector<HTMLButtonElement>('button.close').click();
    expect(activeModal.dismiss.calls.allArgs()).toEqual([['Cancel'], ['Cross click']]);
    expect(wishService.addReservation).not.toHaveBeenCalled();
  });
});
