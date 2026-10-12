import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { environment } from 'src/environments/environment';
import { CloudinaryService } from 'src/app/images/services/cloudinary.service';
import { Person } from 'src/app/people/models/person.model';
import { PeopleService } from 'src/app/people/service/people.service';
import { User } from 'src/app/users/models/user.model';
import { UserService } from 'src/app/users/service/user.service';
import { Wish } from '../models/wish.model';
import { WishService } from './wish.service';

// Legt vast hoe de app met de wish- en wishlist-API praat (sc-2979). Dekt onder meer
// wens aanmaken (sc-1977), reserveren (sc-1979) en reservatie verwijderen (sc-2515),
// feedback (sc-1980), wens verwijderen (sc-1981), kopieën (sc-2348) en sluiten (sc-2442).
describe('WishService', () => {
  const api = environment.apiUrl;
  let service: WishService;
  let http: HttpTestingController;
  let people: jasmine.SpyObj<PeopleService>;
  let images: jasmine.SpyObj<CloudinaryService>;

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
    images = jasmine.createSpyObj<CloudinaryService>('CloudinaryService', ['isTemporaryImage', 'renameImage', 'deleteImage']);
    images.isTemporaryImage.and.returnValue(false);
    images.deleteImage.and.returnValue(of(null));
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: UserService, useValue: { currentUser: new User('rob', 'Reservator', 'Rob', 'rob@gimmi.be', 'local', 't', []) } },
        { provide: PeopleService, useValue: people },
        { provide: CloudinaryService, useValue: images }
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
          wishResponse({ _id: 'w2', reservation: { reservedBy: 'rob', amount: 1, reason: 'x', reservationDate: '2026-10-02' } })
        ]
      }]);
      flushState('w1', 'Open');
      flushState('w2', 'Reserved');

      expect(ontvanger.fullName).toBe('Ria Receiver');
      expect(wensen.map(w => w.id)).toEqual(['w1', 'w2']);
      expect(wensen[0].status).toBe('Open');
      expect(wensen[0].url).toBe('http://boek.be');
      expect(wensen[0].image).toEqual({ publicId: 'img1', version: '3' });
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

  it('delete: verwijdert de wens uit de lijst en ruimt de afbeelding op', () => {
    const [wens] = laadLijst('w1', 'w2');
    service.delete(wens).subscribe();
    const req = http.expectOne(`${api}wish/w1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(wishResponse({ image: { public_id: 'img1', version: 1 } }));
    expect(huidigeLijst().map(w => w.id)).toEqual(['w2']);
    expect(images.deleteImage).toHaveBeenCalledWith({ publicId: 'img1', version: '1' });
  });

  describe('create', () => {
    it('post de nieuwe wens, zet hem bovenaan de lijst en slaat hem daarna op', () => {
      laadLijst('w0');
      const wens = nieuweWens();
      wens.copyOf = 'origineel';
      wens.image = { publicId: 'img9', version: '7' };
      let aangemaakt: Wish;
      service.create(wens).subscribe(w => aangemaakt = w);

      const post = http.expectOne(`${api}wish`);
      expect(post.request.body).toEqual({
        title: 'Boek', price: 20, url: 'http://boek.be', color: null, size: null, description: null,
        receiver: 'ria', createdBy: 'ria', amountWanted: 1,
        image: { public_id: 'img9', version: 7 }, copyOf: 'origineel'
      });
      post.flush(wishResponse({ _id: 'w1', image: { public_id: 'img9', version: 7 } }));
      flushState('w1', 'Open');
      expect(huidigeLijst().map(w => w.id)).toEqual(['w1', 'w0']);

      const put = http.expectOne(`${api}wish/w1`);
      expect(put.request.method).toBe('PUT');
      expect(put.request.body.image).toEqual({ public_id: 'img9', version: 7 });
      put.flush(wishResponse({ _id: 'w1' }));
      flushState('w1', 'Open');
      expect(aangemaakt.id).toBe('w1');
    });

    it('tijdelijke afbeelding krijgt de id van de wens als naam', () => {
      laadLijst();
      images.isTemporaryImage.and.returnValues(true, false);
      images.renameImage.and.returnValue(of({ publicId: 'w1', version: '8' }));
      const wens = nieuweWens();
      wens.image = { publicId: 'tmp/123', version: '1' };
      service.create(wens).subscribe();
      http.expectOne(`${api}wish`).flush(wishResponse({ _id: 'w1', image: { public_id: 'tmp/123', version: 1 } }));
      flushState('w1', 'Open');
      expect(images.renameImage).toHaveBeenCalledWith('tmp/123', 'w1');
      const put = http.expectOne(`${api}wish/w1`);
      expect(put.request.body.image).toEqual({ public_id: 'w1', version: 8 });
      put.flush(wishResponse({ _id: 'w1' }));
      flushState('w1', 'Open');
    });
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
