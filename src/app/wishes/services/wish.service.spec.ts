import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { environment } from 'src/environments/environment';
import { Person } from 'src/app/people/models/person.model';
import { PeopleService } from 'src/app/people/service/people.service';
import { User } from 'src/app/users/models/user.model';
import { UserService } from 'src/app/users/service/user.service';
import { Wish } from '../models/wish.model';
import { imageUitApi, imageVoorApi, WishService } from './wish.service';

// Legt vast hoe de app met de wish- en wishlist-API praat (sc-2979). Dekt onder meer
// wens aanmaken (sc-1977), reserveren (sc-1979) en reservatie verwijderen (sc-2515),
// feedback (sc-1980), wens verwijderen (sc-1981), kopieën (sc-2348) en sluiten (sc-2442).
describe('WishService', () => {
  const api = environment.apiUrl;
  let service: WishService;
  let http: HttpTestingController;
  let people: jasmine.SpyObj<PeopleService>;

  const ria = new Person('ria', 'Ria', 'Receiver');
  const rob = new Person('rob', 'Rob', 'Reservator');

  function wishResponse(overrides: any = {}) {
    return {
      _id: 'w1', receiver: 'ria', title: 'Boek', price: 20, url: 'boek.be', amountWanted: 1,
      createdBy: { _id: 'ria', firstName: 'Ria', lastName: 'Receiver' },
      createdAt: '2026-10-01', updatedAt: '2026-10-01', image: null,
      ...overrides
    };
  }

  function flushState(wishId: string, state: string) {
    http.expectOne(`${api}wish/${wishId}/state`).flush(state);
  }

  function nieuweWens(): Wish {
    return new Wish('w1', 'Boek', 20, 'boek.be', ria, ria, null, null, null, 1);
  }

  beforeEach(() => {
    people = jasmine.createSpyObj<PeopleService>('PeopleService', ['getPersonById']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: UserService, useValue: { currentUser: new User('rob', 'Reservator', 'Rob', 'rob@gimmi.be', 'local', 't', []) } },
        { provide: PeopleService, useValue: people }
      ]
    });
    service = TestBed.inject(WishService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('getWishlist', () => {
    it('zet de ontvanger en zet elke wens om, met status en reservator', () => {
      people.getPersonById.and.returnValue(of(rob));
      let wensen: Wish[];
      let ontvanger: Person;
      service.currentReceiver.subscribe(p => ontvanger = p);

      service.getWishlist(ria).subscribe(w => wensen = w);
      http.expectOne(`${api}wishlist/ria`).flush([{
        _id: { receiver: { _id: 'ria', firstName: 'Ria', lastName: 'Receiver' } },
        count: 2,
        wishes: [
          wishResponse({ _id: 'w1', image: { public_id: 'img1', version: 3 } }),
          wishResponse({ _id: 'w3', image: { key: 'wishes/a.jpg', url: 'https://img.gimmi.be/wishes/a.jpg' } }),
          wishResponse({ _id: 'w2', reservation: { reservedBy: 'rob', amount: 1, reason: 'x', reservationDate: '2026-10-02' } })
        ]
      }]);
      flushState('w1', 'Open');
      flushState('w3', 'Open');
      flushState('w2', 'Reserved');

      expect(ontvanger.fullName).toBe('Ria Receiver');
      expect(wensen.map(w => w.id)).toEqual(['w1', 'w3', 'w2']);
      expect(wensen[0].status).toBe('Open');
      expect(wensen[0].url).toBe('http://boek.be');
      expect(wensen[0].image).toEqual({ publicId: 'img1', version: '3' });
      expect(wensen[1].image).toEqual({ key: 'wishes/a.jpg', url: 'https://img.gimmi.be/wishes/a.jpg' });
      wensen.splice(1, 1);
      expect(wensen[1].reservation.reservedBy.fullName).toBe('Rob Reservator');
      expect(wensen[1].scenario).toBe('RESERVED_BY_USER'); // ingelogd als rob
      expect(people.getPersonById).toHaveBeenCalledWith('rob');
    });

    it('lege wensenlijst: lege lijst', () => {
      let wensen: Wish[];
      service.getWishlist(ria).subscribe(w => wensen = w);
      http.expectOne(`${api}wishlist/ria`).flush([{ _id: { receiver: { _id: 'ria', firstName: 'Ria', lastName: 'Receiver' } }, count: 0, wishes: [] }]);
      expect(wensen).toEqual([]);
    });

    it('status "Closed" van de API wordt "Fulfilled"; fout bij de status: "Open"', () => {
      spyOn(console, 'error');
      let wensen: Wish[];
      service.getWishlist(ria).subscribe(w => wensen = w);
      http.expectOne(`${api}wishlist/ria`).flush([{
        _id: { receiver: { _id: 'ria', firstName: 'Ria', lastName: 'Receiver' } }, count: 2,
        wishes: [wishResponse({ _id: 'w1' }), wishResponse({ _id: 'w2' })]
      }]);
      flushState('w1', 'Closed');
      http.expectOne(`${api}wish/w2/state`).flush('kapot', { status: 500, statusText: 'Error' });
      expect(wensen.map(w => w.status)).toEqual(['Fulfilled', 'Open']);
    });

    it('onbekende reservator: reservatie blijft, met naam "not found"', () => {
      spyOn(console, 'error');
      people.getPersonById.and.returnValue(throwError('404'));
      let wensen: Wish[];
      service.getWishlist(ria).subscribe(w => wensen = w);
      http.expectOne(`${api}wishlist/ria`).flush([{
        _id: { receiver: { _id: 'ria', firstName: 'Ria', lastName: 'Receiver' } }, count: 1,
        wishes: [wishResponse({ reservation: { reservedBy: 'weg', amount: 1, reason: null, reservationDate: null } })]
      }]);
      flushState('w1', 'Reserved');
      expect(wensen[0].reservation.reservedBy.id).toBe('weg');
      expect(wensen[0].reservation.reservedBy.fullName).toBe('not found');
    });

    it('closure: closedBy wordt opgezocht als persoon', () => {
      people.getPersonById.and.returnValue(of(ria));
      let wensen: Wish[];
      service.getWishlist(ria).subscribe(w => wensen = w);
      http.expectOne(`${api}wishlist/ria`).flush([{
        _id: { receiver: { _id: 'ria', firstName: 'Ria', lastName: 'Receiver' } }, count: 1,
        wishes: [wishResponse({ closure: { closedBy: 'ria', reason: 'Cadeau ontvangen', closedOn: '2026-10-03' } })]
      }]);
      flushState('w1', 'Closed');
      expect(wensen[0].closure.closedBy.fullName).toBe('Ria Receiver');
      expect(wensen[0].closure.reason).toBe('Cadeau ontvangen');
    });
  });

  function laadLijst(...ids: string[]): Wish[] {
    let wensen: Wish[];
    service.getWishlist(ria).subscribe(w => wensen = w);
    http.expectOne(`${api}wishlist/ria`).flush([{
      _id: { receiver: { _id: 'ria', firstName: 'Ria', lastName: 'Receiver' } }, count: ids.length,
      wishes: ids.map(id => wishResponse({ _id: id }))
    }]);
    ids.forEach(id => flushState(id, 'Open'));
    return wensen;
  }

  function huidigeLijst(): Wish[] {
    let wensen: Wish[];
    service.wishes.subscribe(w => wensen = w).unsubscribe();
    return wensen;
  }

  describe('reservatie', () => {
    it('addReservation: stuurt de id van de reservator en werkt de wens in de lijst bij', () => {
      people.getPersonById.and.returnValue(of(rob));
      const [wens] = laadLijst('w1');
      let bijgewerkt: Wish;
      service.addReservation(wens, { reservedBy: rob, amount: 1, reason: 'verjaardag', reservationDate: null })
        .subscribe(w => bijgewerkt = w);
      const req = http.expectOne(`${api}wish/w1/reservation`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.reservedBy).toBe('rob');
      req.flush(wishResponse({
        createdBy: { _id: 'ria', id: 'ria', firstName: 'Ria', lastName: 'Receiver' },
        reservation: { reservedBy: { _id: 'rob', id: 'rob', firstName: 'Rob', lastName: 'Reservator' }, amount: 1, reason: 'verjaardag', reservationDate: null }
      }));
      flushState('w1', 'Reserved');
      expect(bijgewerkt.status).toBe('Reserved');
      expect(huidigeLijst()[0].status).toBe('Reserved');
    });

    it('deleteReservation: DELETE en de wens staat weer open', () => {
      const [wens] = laadLijst('w1');
      let bijgewerkt: Wish;
      service.deleteReservation(wens).subscribe(w => bijgewerkt = w);
      const req = http.expectOne(`${api}wish/w1/reservation`);
      expect(req.request.method).toBe('DELETE');
      req.flush(wishResponse());
      flushState('w1', 'Open');
      expect(bijgewerkt.reservation).toBeUndefined();
      expect(bijgewerkt.status).toBe('Open');
    });
  });

  it('addGiftFeedback: post de feedback naar /feedback', () => {
    const [wens] = laadLijst('w1');
    const feedback = { satisfaction: 'blij', receivedOn: null, message: 'dank je', putBackOnList: false };
    let bijgewerkt: Wish;
    service.addGiftFeedback(wens, feedback).subscribe(w => bijgewerkt = w);
    const req = http.expectOne(`${api}wish/w1/feedback`);
    expect(req.request.body).toEqual(feedback);
    req.flush(wishResponse({ giftFeedback: { _id: 'f1', ...feedback } }));
    flushState('w1', 'Received');
    expect(bijgewerkt.giftFeedback.message).toBe('dank je');
  });

  it('close: sluit af door de ingelogde gebruiker met reden "Cadeau ontvangen"', () => {
    const [wens] = laadLijst('w1');
    service.close(wens).subscribe();
    const req = http.expectOne(`${api}wish/w1/closure`);
    expect(req.request.body.closedBy).toBe('rob');
    expect(req.request.body.reason).toBe('Cadeau ontvangen');
    req.flush(wishResponse());
    flushState('w1', 'Closed');
  });

  it('delete: verwijdert de wens uit de lijst; de afbeelding ruimt de backend op (sc-3052)', () => {
    const [wens] = laadLijst('w1', 'w2');
    service.delete(wens).subscribe();
    const req = http.expectOne(`${api}wish/w1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(wishResponse({ image: { public_id: 'img1', version: 1 } }));
    expect(huidigeLijst().map(w => w.id)).toEqual(['w2']);
  });

  describe('create', () => {
    it('post de nieuwe wens met de sleutel van de afbeelding en zet hem bovenaan de lijst, zonder tweede PUT', () => {
      laadLijst('w0');
      const wens = nieuweWens();
      wens.copyOf = 'origineel';
      wens.image = { key: 'wishes/a.jpg', url: 'https://img.gimmi.be/wishes/a.jpg' };
      let aangemaakt: Wish;
      service.create(wens).subscribe(w => aangemaakt = w);

      const post = http.expectOne(`${api}wish`);
      expect(post.request.body).toEqual({
        title: 'Boek', price: 20, url: 'http://boek.be', color: null, size: null, description: null,
        receiver: 'ria', createdBy: 'ria', amountWanted: 1,
        image: { key: 'wishes/a.jpg' }, copyOf: 'origineel'
      });
      post.flush(wishResponse({ _id: 'w1', image: { key: 'wishes/a.jpg', url: 'https://img.gimmi.be/wishes/a.jpg' } }));
      flushState('w1', 'Open');
      expect(huidigeLijst().map(w => w.id)).toEqual(['w1', 'w0']);
      expect(aangemaakt.id).toBe('w1');
      expect(aangemaakt.image).toEqual({ key: 'wishes/a.jpg', url: 'https://img.gimmi.be/wishes/a.jpg' });
    });

    it('zonder afbeelding: geen image-veld in de POST', () => {
      laadLijst();
      service.create(nieuweWens()).subscribe();
      const post = http.expectOne(`${api}wish`);
      expect('image' in post.request.body).toBeFalse();
      post.flush(wishResponse({ _id: 'w1' }));
      flushState('w1', 'Open');
    });
  });

  describe('update', () => {
    it('PUT met de wens, het afbeeldingsveld in de vorm van de API, en werkt de lijst bij', () => {
      const [wens] = laadLijst('w1', 'w2');
      wens.title = 'Nieuw boek';
      wens.image = { key: 'wishes/b.jpg', url: 'https://img.gimmi.be/wishes/b.jpg' };
      service.update(wens).subscribe();
      const put = http.expectOne(`${api}wish/w1`);
      expect(put.request.method).toBe('PUT');
      expect(put.request.body._id).toBe('w1');
      expect(put.request.body.title).toBe('Nieuw boek');
      expect(put.request.body.image).toEqual({ key: 'wishes/b.jpg' });
      put.flush(wishResponse({ _id: 'w1', title: 'Nieuw boek', image: { key: 'wishes/b.jpg', url: 'https://img.gimmi.be/wishes/b.jpg' } }));
      flushState('w1', 'Open');
      expect(huidigeLijst()[0].title).toBe('Nieuw boek');
      expect(huidigeLijst()[0].image.key).toBe('wishes/b.jpg');
    });

    it('een nog niet gemigreerd Cloudinary-beeld gaat ongewijzigd mee', () => {
      const [wens] = laadLijst('w1');
      wens.image = { publicId: 'wish_images/w1', version: '3' };
      service.update(wens).subscribe();
      const put = http.expectOne(`${api}wish/w1`);
      expect(put.request.body.image).toEqual({ public_id: 'wish_images/w1', version: 3 });
      put.flush(wishResponse({ _id: 'w1' }));
      flushState('w1', 'Open');
    });
  });

  it('imageVoorApi en imageUitApi: R2, Cloudinary of niets', () => {
    expect(imageVoorApi({ key: 'wishes/a.jpg', url: 'u' })).toEqual({ key: 'wishes/a.jpg' });
    expect(imageVoorApi({ publicId: 'p', version: '4' })).toEqual({ public_id: 'p', version: 4 });
    expect(imageVoorApi(null)).toBeUndefined();
    expect(imageUitApi({ key: 'wishes/a.jpg', url: 'u' })).toEqual({ key: 'wishes/a.jpg', url: 'u' });
    expect(imageUitApi({ public_id: 'p', version: 4 })).toEqual({ publicId: 'p', version: '4' });
    expect(imageUitApi({ key: 'wishes/a.jpg' })).toBeUndefined();
    expect(imageUitApi(null)).toBeUndefined();
  });

  describe('getCopiesOnListOf', () => {
    it('vraagt de kopieën op van de lijst van een ontvanger', () => {
      spyOn(console, 'log');
      let kopieen: Wish[];
      service.getCopiesOnListOf(ria).subscribe(w => kopieen = w);
      http.expectOne(`${api}wishlist/ria/copies`).flush([{ id: 'k1' }]);
      expect(kopieen.length).toBe(1);
    });

    it('zonder ontvanger: lege lijst zonder request', () => {
      let kopieen: Wish[];
      service.getCopiesOnListOf(null).subscribe(w => kopieen = w);
      expect(kopieen).toEqual([]);
    });
  });

  describe('getWishById', () => {
    it('wens uit de geladen lijst: geen request', () => {
      laadLijst('w1');
      let wens: Wish;
      service.getWishById('w1').subscribe(w => wens = w);
      expect(wens.id).toBe('w1');
      // tweede keer uit de geselecteerde wens
      service.getWishById('w1').subscribe(w => wens = w);
      expect(wens.id).toBe('w1');
    });

    it('onbekende wens: opgehaald, met de ontvanger erbij', () => {
      people.getPersonById.and.returnValue(of(ria));
      let wens: Wish;
      service.getWishById('w5').subscribe(w => wens = w);
      http.expectOne(`${api}wish/w5`).flush([wishResponse({ _id: 'w5' })]);
      flushState('w5', 'Open');
      expect(wens.id).toBe('w5');
      expect(wens.receiver.fullName).toBe('Ria Receiver');
    });

    it('zonder id: null', () => {
      let wens: Wish = undefined;
      service.getWishById('').subscribe(w => wens = w);
      expect(wens).toBeNull();
    });
  });
});
