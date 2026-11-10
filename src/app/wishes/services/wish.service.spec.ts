import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';

import { environment } from 'src/environments/environment';
import type { Schema } from 'src/app/core/api/api-types';
import { Person } from 'src/app/people/models/person.model';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { Wish } from '../models/wish.model';
import { apiWish } from '../models/wish-from-api.testing';
import { imageVoorApi, WishService } from './wish.service';

// Legt vast hoe de app met de wish- en wishlist-API praat (sc-2979). Lezen gaat via API v2 (sc-3288),
// schrijven nog via v1 met daarna een lees van de wens: wens aanmaken (sc-1977), reserveren (sc-1979),
// reservatie verwijderen (sc-2515), feedback (sc-1980), verwijderen (sc-1981), kopieën (sc-2348), sluiten (sc-2442).
describe('WishService', () => {
    const v1 = environment.apiUrl;
    const v2 = environment.apiV2Url;
    let service: WishService;
    let http: HttpTestingController;

    const ria = new Person('ria', 'Ria', 'Receiver');

    function nieuweWens(): Wish {
        return new Wish('w1', 'Boek', 20, 'boek.be', ria, ria, null, null, null, 1);
    }

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: AuthStore, useValue: fakeAuthStore(testUser({ id: 'rob', firstName: 'Rob', lastName: 'Reservator', fullName: 'Rob Reservator', email: 'rob@gimmi.be' })) },
                provideHttpClient(withXhr()),
                provideHttpClientTesting()
            ]
        });
        service = TestBed.inject(WishService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    function page(items: Schema<'Wish'>[], nextCursor: string | null = null) {
        return { items, nextCursor, counts: { open: items.length, reserved: 0, received: 0, fulfilled: 0 } };
    }

    /** Loads a list of wishes for `ria` through the page endpoint. */
    function laadLijst(...ids: string[]): Wish[] {
        let wensen: Wish[];
        service.getWishlist(ria).subscribe(w => wensen = w);
        http.expectOne(`${v2}people/ria/wishes?limit=100`).flush(page(ids.map(id => apiWish({ id }))));
        return wensen;
    }

    function huidigeLijst(): Wish[] {
        let wensen: Wish[];
        service.wishes.subscribe(w => wensen = w).unsubscribe();
        return wensen;
    }

    describe('getWishlist', () => {
        it('één request per pagina; zet de ontvanger en zet elke wens om', () => {
            let ontvanger: Person;
            service.currentReceiver.subscribe(p => ontvanger = p);
            const wensen = laadLijst('w1', 'w2');
            expect(wensen.map(w => w.id)).toEqual(['w1', 'w2']);
            expect(ontvanger).toBe(ria);
            expect(huidigeLijst()).toEqual(wensen);
        });

        it('haalt alle pagina\'s op tot er geen nextCursor meer is', () => {
            let wensen: Wish[];
            service.getWishlist(ria).subscribe(w => wensen = w);
            http.expectOne(`${v2}people/ria/wishes?limit=100`).flush(page([apiWish({ id: 'w1' })], 'c1'));
            http.expectOne(`${v2}people/ria/wishes?limit=100&cursor=c1`).flush(page([apiWish({ id: 'w2' })], 'c2'));
            http.expectOne(`${v2}people/ria/wishes?limit=100&cursor=c2`).flush(page([apiWish({ id: 'w3' })]));
            expect(wensen.map(w => w.id)).toEqual(['w1', 'w2', 'w3']);
        });

        it('een lege lijst geeft een lege array', () => {
            expect(laadLijst()).toEqual([]);
        });

        it('doet geen aparte aanroepen per wens meer (geen status, geen personen)', () => {
            laadLijst('w1', 'w2', 'w3');
            http.verify();
        });

        it('een fout van de server komt door', () => {
            let fout: { status: number };
            service.getWishlist(ria).subscribe({ error: e => fout = e });
            http.expectOne(`${v2}people/ria/wishes?limit=100`).flush({ status: 404 }, { status: 404, statusText: 'Not Found' });
            expect(fout.status).toBe(404);
        });
    });

    describe('reservatie (v1, daarna lees v2)', () => {
        it('addReservation: stuurt de id van de reservator en werkt de wens in de lijst bij', () => {
            const [wens] = laadLijst('w1');
            let bijgewerkt: Wish;
            service.addReservation(wens, { reservedBy: new Person('rob', 'Rob', 'Reservator'), amount: 1, reason: 'verjaardag', reservationDate: null })
                .subscribe(w => bijgewerkt = w);
            const req = http.expectOne(`${v1}wish/w1/reservation`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body.reservedBy).toBe('rob');
            req.flush({});
            http.expectOne(`${v2}wishes/w1`).flush(apiWish({ id: 'w1', status: 'reserved', reservation: { reservedBy: { id: 'rob', firstName: 'Rob', lastName: 'Reservator' } } }));
            expect(bijgewerkt.status).toBe('Reserved');
            expect(huidigeLijst()[0].status).toBe('Reserved');
        });

        it('deleteReservation: DELETE en de wens staat weer open', () => {
            const [wens] = laadLijst('w1');
            let bijgewerkt: Wish;
            service.deleteReservation(wens).subscribe(w => bijgewerkt = w);
            const req = http.expectOne(`${v1}wish/w1/reservation`);
            expect(req.request.method).toBe('DELETE');
            req.flush({});
            http.expectOne(`${v2}wishes/w1`).flush(apiWish({ id: 'w1', status: 'open' }));
            expect(bijgewerkt.reservation).toBeUndefined();
            expect(bijgewerkt.status).toBe('Open');
        });
    });

    it('addGiftFeedback: post de feedback naar /feedback en leest de wens opnieuw', () => {
        const [wens] = laadLijst('w1');
        const feedback = { satisfaction: 'blij', receivedOn: null as Date, message: 'dank je', putBackOnList: false };
        let bijgewerkt: Wish;
        service.addGiftFeedback(wens, feedback).subscribe(w => bijgewerkt = w);
        const req = http.expectOne(`${v1}wish/w1/feedback`);
        expect(req.request.body).toEqual(feedback);
        req.flush({});
        http.expectOne(`${v2}wishes/w1`).flush(apiWish({
            id: 'w1', status: 'fulfilled',
            fulfillment: { receivedOn: '2026-10-05', givenBy: null, satisfaction: 4, message: 'dank je', fulfilledAt: '2026-10-05T10:00:00Z' }
        }));
        expect(bijgewerkt.giftFeedback.message).toBe('dank je');
    });

    it('close: sluit af door de ingelogde gebruiker met reden "Cadeau ontvangen"', () => {
        const [wens] = laadLijst('w1');
        service.close(wens).subscribe();
        const req = http.expectOne(`${v1}wish/w1/closure`);
        expect(req.request.body.closedBy).toBe('rob');
        expect(req.request.body.reason).toBe('Cadeau ontvangen');
        req.flush({});
        http.expectOne(`${v2}wishes/w1`).flush(apiWish({ id: 'w1', status: 'fulfilled' }));
    });

    it('delete: verwijdert de wens uit de lijst; de afbeelding ruimt de backend op (sc-3052)', () => {
        const [wens] = laadLijst('w1', 'w2');
        service.delete(wens).subscribe();
        const req = http.expectOne(`${v1}wish/w1`);
        expect(req.request.method).toBe('DELETE');
        req.flush({});
        expect(huidigeLijst().map(w => w.id)).toEqual(['w2']);
    });

    describe('create', () => {
        it('post de nieuwe wens met de sleutel van de afbeelding, leest hem en zet hem bovenaan de lijst', () => {
            laadLijst('w0');
            const wens = nieuweWens();
            wens.copyOf = 'origineel';
            wens.image = { key: 'wishes/a.jpg', url: 'https://img.gimmi.be/wishes/a.jpg' };
            let aangemaakt: Wish;
            service.create(wens).subscribe(w => aangemaakt = w);

            const post = http.expectOne(`${v1}wish`);
            expect(post.request.body).toEqual({
                title: 'Boek', price: 20, url: 'http://boek.be', color: null, size: null, description: null,
                receiver: 'ria', createdBy: 'ria', amountWanted: 1,
                image: { key: 'wishes/a.jpg' }, copyOf: 'origineel'
            });
            post.flush({ _id: 'w1' });
            http.expectOne(`${v2}wishes/w1`).flush(apiWish({ id: 'w1', image: { key: 'wishes/a.jpg', url: 'https://img.gimmi.be/wishes/a.jpg' } }));
            expect(huidigeLijst().map(w => w.id)).toEqual(['w1', 'w0']);
            expect(aangemaakt.id).toBe('w1');
            expect(aangemaakt.image).toEqual({ key: 'wishes/a.jpg', url: 'https://img.gimmi.be/wishes/a.jpg' });
        });

        it('zonder afbeelding: geen image-veld in de POST', () => {
            laadLijst();
            service.create(nieuweWens()).subscribe();
            const post = http.expectOne(`${v1}wish`);
            expect('image' in post.request.body).toBe(false);
            post.flush({ _id: 'w1' });
            http.expectOne(`${v2}wishes/w1`).flush(apiWish({ id: 'w1' }));
        });

        it('geeft een nieuwe array door, zodat een signal op de lijst de wijziging ziet (sc-3323)', () => {
            laadLijst('w0');
            const eerste = huidigeLijst();
            service.create(nieuweWens()).subscribe();
            http.expectOne(`${v1}wish`).flush({ _id: 'w1' });
            http.expectOne(`${v2}wishes/w1`).flush(apiWish({ id: 'w1' }));
            expect(huidigeLijst()).not.toBe(eerste);
        });

        it('een kopie: de originele wens op de pagina weet nu dat er een eigen kopie is', () => {
            const [origineel] = laadLijst('origineel');
            expect(origineel.viewer.ownCopyId).toBeNull();
            const kopie = nieuweWens();
            kopie.copyOf = 'origineel';
            service.create(kopie).subscribe();
            http.expectOne(`${v1}wish`).flush({ _id: 'k1' });
            http.expectOne(`${v2}wishes/k1`).flush(apiWish({ id: 'k1', copyOf: 'origineel' }));
            expect(origineel.viewer.ownCopyId).toBe('k1');
        });
    });

    describe('update', () => {
        it('PUT met de wens, het afbeeldingsveld in de vorm van de API, en werkt de lijst bij', () => {
            const [wens] = laadLijst('w1', 'w2');
            wens.title = 'Nieuw boek';
            wens.image = { key: 'wishes/b.jpg', url: 'https://img.gimmi.be/wishes/b.jpg' };
            service.update(wens).subscribe();
            const put = http.expectOne(`${v1}wish/w1`);
            expect(put.request.method).toBe('PUT');
            expect(put.request.body._id).toBe('w1');
            expect(put.request.body.title).toBe('Nieuw boek');
            expect(put.request.body.image).toEqual({ key: 'wishes/b.jpg' });
            put.flush({});
            http.expectOne(`${v2}wishes/w1`).flush(apiWish({ id: 'w1', title: 'Nieuw boek', image: { key: 'wishes/b.jpg', url: 'https://img.gimmi.be/wishes/b.jpg' } }));
            expect(huidigeLijst()[0].title).toBe('Nieuw boek');
            expect(huidigeLijst()[0].image.key).toBe('wishes/b.jpg');
        });
    });

    it('imageVoorApi: R2 of niets', () => {
        expect(imageVoorApi({ key: 'wishes/a.jpg', url: 'u' })).toEqual({ key: 'wishes/a.jpg' });
        expect(imageVoorApi({})).toBeUndefined();
        expect(imageVoorApi(null)).toBeUndefined();
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

        it('onbekende wens: één request naar v2, met de ontvanger erbij', () => {
            let wens: Wish;
            service.getWishById('w5').subscribe(w => wens = w);
            http.expectOne(`${v2}wishes/w5`).flush(apiWish({ id: 'w5' }));
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
