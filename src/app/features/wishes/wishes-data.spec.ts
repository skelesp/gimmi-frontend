import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { problemInterceptor } from 'src/app/core/api/problem-interceptor';

import { environment } from 'src/environments/environment';
import type { Schema } from 'src/app/core/api/api-types';
import { Person } from 'src/app/features/people/models/person.model';
import { Wish } from './models/wish.model';
import { apiWish } from './models/wish-from-api.testing';
import { ProblemNotifier } from 'src/app/core/api/problem-notifier';
import { WishesData } from './wishes-data';

// Legt vast hoe de app met de wish- en wishlist-API praat (sc-2979). Lezen, aanmaken, wijzigen, verwijderen
// en kopiëren gaan via API v2 (sc-3288, sc-3289): wens aanmaken (sc-1977), verwijderen (sc-1981), kopieën (sc-2348).
// Reserveren (sc-1979), reservatie verwijderen (sc-2515) en het cadeau bevestigen met feedback (sc-1980, sc-2442) gaan
// sinds sc-3291 ook via API v2.
describe('WishesData', () => {
    const v2 = environment.apiV2Url;
    let service: WishesData;
    let http: HttpTestingController;

    const ria = new Person('ria', 'Ria', 'Receiver');
    let problems: { show: ReturnType<typeof vi.fn> };

    function nieuweWens(): Wish {
        return new Wish('w1', 'Boek', 20, 'boek.be', ria, ria, null, null, null, 1);
    }

    beforeEach(() => {
        problems = { show: vi.fn().mockName('ProblemNotifier.show') };
        TestBed.configureTestingModule({
            providers: [
                { provide: ProblemNotifier, useValue: problems },
                provideHttpClient(withXhr(), withInterceptors([problemInterceptor])),
                provideHttpClientTesting()
            ]
        });
        service = TestBed.inject(WishesData);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    /** Answers the request with an `application/problem+json` error, as API v2 does. */
    function flushProblem(url: string, status: number, code: string) {
        http.expectOne(url).flush({ status, code, title: 'Problem' }, { status, statusText: 'Error', headers: { 'Content-Type': 'application/problem+json' } });
    }

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

    describe('reservatie', () => {
        it('addReservation: PUT /wishes/{id}/reservation met datum en gelegenheid; de wens in de lijst volgt het antwoord', () => {
            const [wens] = laadLijst('w1');
            let bijgewerkt: Wish;
            service.addReservation(wens, { handoverDate: '2026-12-24', occasion: 'birthday' }).subscribe(w => bijgewerkt = w);
            const req = http.expectOne(`${v2}wishes/w1/reservation`);
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual({ handoverDate: '2026-12-24', occasion: 'birthday' });
            req.flush(apiWish({ id: 'w1', status: 'reserved', reservation: { reservedBy: { id: 'rob', firstName: 'Rob', lastName: 'Reservator' } } }));
            expect(bijgewerkt.status).toBe('Reserved');
            expect(huidigeLijst()[0].status).toBe('Reserved');
        });

        it('addReservation: een tweede gever komt te laat (409): melding, geen waarde, de wens wordt opnieuw gelezen', () => {
            const [wens] = laadLijst('w1');
            const waarde = vi.fn();
            service.addReservation(wens, { handoverDate: '2026-12-24', occasion: 'other' }).subscribe(waarde);
            flushProblem(`${v2}wishes/w1/reservation`, 409, 'wish-already-reserved');
            expect(problems.show).toHaveBeenCalledTimes(1);
            http.expectOne(`${v2}wishes/w1`).flush(apiWish({ id: 'w1', status: 'reserved' }));
            expect(waarde).not.toHaveBeenCalled();
            expect(huidigeLijst()[0].status).toBe('Reserved');
        });

        it('addReservation: een andere fout (422): melding en geen nieuwe lees', () => {
            const [wens] = laadLijst('w1');
            service.addReservation(wens, { handoverDate: '2026-12-24', occasion: 'other' }).subscribe();
            flushProblem(`${v2}wishes/w1/reservation`, 422, 'date-in-future');
            expect(problems.show).toHaveBeenCalledTimes(1);
        });

        it('deleteReservation: DELETE /wishes/{id}/reservation (204), daarna een lees: de wens staat weer open', () => {
            const [wens] = laadLijst('w1');
            let bijgewerkt: Wish;
            service.deleteReservation(wens).subscribe(w => bijgewerkt = w);
            const req = http.expectOne(`${v2}wishes/w1/reservation`);
            expect(req.request.method).toBe('DELETE');
            req.flush(null, { status: 204, statusText: 'No Content' });
            http.expectOne(`${v2}wishes/w1`).flush(apiWish({ id: 'w1', status: 'open' }));
            expect(bijgewerkt.reservation).toBeUndefined();
            expect(bijgewerkt.status).toBe('Open');
        });

        it('deleteReservation: een fout (403) wordt gemeld', () => {
            const [wens] = laadLijst('w1');
            service.deleteReservation(wens).subscribe();
            flushProblem(`${v2}wishes/w1/reservation`, 403, 'forbidden');
            expect(problems.show).toHaveBeenCalledTimes(1);
        });
    });

    describe('fulfill', () => {
        const feedback = { receivedOn: '2026-10-05', satisfaction: 4, message: 'dank je', putBackOnList: false };
        const vervuld = (fulfillment: Record<string, unknown> = {}) => apiWish({
            id: 'w1', status: 'fulfilled',
            fulfillment: { receivedOn: '2026-10-05', givenBy: null, satisfaction: 4, message: 'dank je', fulfilledAt: '2026-10-05T10:00:00Z', ...fulfillment }
        });

        it('PUT /wishes/{id}/fulfillment met alles in één oproep; de wens in de lijst volgt het antwoord', () => {
            const [wens] = laadLijst('w1');
            let bijgewerkt: Wish;
            service.fulfill(wens, feedback).subscribe(w => bijgewerkt = w);
            const req = http.expectOne(`${v2}wishes/w1/fulfillment`);
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual(feedback);
            req.flush(vervuld());
            expect(bijgewerkt.giftFeedback.message).toBe('dank je');
            expect(huidigeLijst()[0].status).toBe('Fulfilled');
        });

        it('een lege boodschap gaat als null', () => {
            const [wens] = laadLijst('w1');
            service.fulfill(wens, { ...feedback, message: '  ' }).subscribe();
            const req = http.expectOne(`${v2}wishes/w1/fulfillment`);
            expect(req.request.body.message).toBeNull();
            req.flush(vervuld());
        });

        it('putBackOnList: de wens die de server terugzette komt bovenaan de lijst, zonder eigen kopie', () => {
            const [wens] = laadLijst('w1');
            let bijgewerkt: Wish;
            service.fulfill(wens, { ...feedback, putBackOnList: true }).subscribe(w => bijgewerkt = w);
            http.expectOne(`${v2}wishes/w1/fulfillment`).flush(vervuld({ relistedWishId: 'w9' }));
            http.expectOne(`${v2}wishes/w9`).flush(apiWish({ id: 'w9', status: 'open' }));
            expect(huidigeLijst().map(w => w.id)).toEqual(['w9', 'w1']);
            expect(bijgewerkt.id).toBe('w1');
        });

        it('putBackOnList: lukt het lezen van de nieuwe wens niet, dan blijft het bevestigen gelukt', () => {
            const [wens] = laadLijst('w1');
            let bijgewerkt: Wish;
            service.fulfill(wens, { ...feedback, putBackOnList: true }).subscribe(w => bijgewerkt = w);
            http.expectOne(`${v2}wishes/w1/fulfillment`).flush(vervuld({ relistedWishId: 'w9' }));
            http.expectOne(`${v2}wishes/w9`).flush({}, { status: 500, statusText: 'Error' });
            expect(bijgewerkt.id).toBe('w1');
        });

        it('een fout (date-in-future) wordt gemeld en geeft geen waarde', () => {
            const [wens] = laadLijst('w1');
            const waarde = vi.fn();
            service.fulfill(wens, feedback).subscribe(waarde);
            flushProblem(`${v2}wishes/w1/fulfillment`, 422, 'date-in-future');
            expect(problems.show).toHaveBeenCalledTimes(1);
            expect(waarde).not.toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('DELETE /wishes/{id} en haalt de wens uit de lijst; de afbeelding ruimt de server op (sc-3052)', () => {
            const [wens] = laadLijst('w1', 'w2');
            let verwijderd: Wish;
            service.delete(wens).subscribe(w => verwijderd = w);
            const req = http.expectOne(`${v2}wishes/w1`);
            expect(req.request.method).toBe('DELETE');
            req.flush(null, { status: 204, statusText: 'No Content' });
            expect(verwijderd).toBe(wens);
            expect(huidigeLijst().map(w => w.id)).toEqual(['w2']);
        });

        it('een fout van de server wordt gemeld en laat de lijst staan', () => {
            const [wens] = laadLijst('w1');
            const gelukt = vi.fn();
            service.delete(wens).subscribe(gelukt);
            flushProblem(`${v2}wishes/w1`, 403, 'forbidden');
            expect(gelukt).not.toHaveBeenCalled();
            expect(problems.show).toHaveBeenCalledTimes(1);
            expect(huidigeLijst().map(w => w.id)).toEqual(['w1']);
        });
    });

    describe('create', () => {
        it('POST /people/{ontvanger}/wishes met bedragen in centen en links als lijst, en zet de wens bovenaan', () => {
            laadLijst('w0');
            const wens = nieuweWens();
            wens.image = { key: 'wishes/a.jpg', url: 'https://img.gimmi.be/wishes/a.jpg' };
            wens.price = 12.34;
            let aangemaakt: Wish;
            service.create(wens).subscribe(w => aangemaakt = w);

            const post = http.expectOne(`${v2}people/ria/wishes`);
            expect(post.request.method).toBe('POST');
            expect(post.request.body).toEqual({
                title: 'Boek', description: null, price: { amount: 1234, currency: 'EUR' }, links: [{ url: 'http://boek.be' }],
                image: { key: 'wishes/a.jpg' }, color: null, size: null
            });
            post.flush(apiWish({ id: 'w1', image: { key: 'wishes/a.jpg', url: 'https://img.gimmi.be/wishes/a.jpg' } }), { status: 201, statusText: 'Created' });
            expect(huidigeLijst().map(w => w.id)).toEqual(['w1', 'w0']);
            expect(aangemaakt.id).toBe('w1');
            expect(aangemaakt.image).toEqual({ key: 'wishes/a.jpg', url: 'https://img.gimmi.be/wishes/a.jpg' });
        });

        it('zonder prijs, link en afbeelding: null, een lege lijst en geen sleutel', () => {
            laadLijst();
            const wens = nieuweWens();
            wens.price = null;
            wens.url = '';
            service.create(wens).subscribe();
            const post = http.expectOne(`${v2}people/ria/wishes`);
            expect(post.request.body).toMatchObject({ price: null, links: [], image: null });
            post.flush(apiWish({ id: 'w1' }), { status: 201, statusText: 'Created' });
        });

        it('geeft een nieuwe array door, zodat een signal op de lijst de wijziging ziet (sc-3323)', () => {
            laadLijst('w0');
            const eerste = huidigeLijst();
            service.create(nieuweWens()).subscribe();
            http.expectOne(`${v2}people/ria/wishes`).flush(apiWish({ id: 'w1' }), { status: 201, statusText: 'Created' });
            expect(huidigeLijst()).not.toBe(eerste);
        });

        it('een fout van de server (bijv. afbeelding niet gevonden) wordt gemeld, zonder een wens toe te voegen', () => {
            laadLijst('w0');
            const gelukt = vi.fn();
            service.create(nieuweWens()).subscribe(gelukt);
            flushProblem(`${v2}people/ria/wishes`, 422, 'image-not-found');
            expect(gelukt).not.toHaveBeenCalled();
            expect(problems.show).toHaveBeenCalledTimes(1);
            expect(huidigeLijst().map(w => w.id)).toEqual(['w0']);
        });
    });

    describe('copy (create met copyOf)', () => {
        function kopieVan(origineel: Wish): Wish {
            const kopie = nieuweWens();
            kopie.id = undefined;
            kopie.copyOf = origineel.id;
            kopie.description = '';
            kopie.image = origineel.image;
            return kopie;
        }

        it('POST /wishes/{origineel}/copies, de afbeelding wordt gedeeld (niet meegestuurd) en de originele weet van de kopie', () => {
            const [origineel] = laadLijst('origineel');
            expect(origineel.viewer.ownCopyId).toBeNull();
            let kopie: Wish;
            service.create(kopieVan(origineel)).subscribe(w => kopie = w);
            const post = http.expectOne(`${v2}wishes/origineel/copies`);
            expect(post.request.body).toEqual({
                title: 'Boek', description: null, price: { amount: 2000, currency: 'EUR' }, links: [{ url: 'http://boek.be' }], color: null, size: null
            });
            post.flush(apiWish({ id: 'k1', copyOf: 'origineel' }), { status: 201, statusText: 'Created' });
            expect(kopie.copyOf).toBe('origineel');
            expect(origineel.viewer.ownCopyId).toBe('k1');
        });

        it('een andere afbeelding in de popup gaat wel mee, en weghalen als null', () => {
            const [origineel] = laadLijst('origineel');
            origineel.image = { key: 'wishes/a.jpg', url: 'u' };
            const andere = kopieVan(origineel);
            andere.image = { key: 'wishes/b.jpg', url: 'u' };
            service.create(andere).subscribe();
            const eerste = http.expectOne(`${v2}wishes/origineel/copies`);
            expect(eerste.request.body.image).toEqual({ key: 'wishes/b.jpg' });
            eerste.flush(apiWish({ id: 'k1' }), { status: 201, statusText: 'Created' });

            const zonder = kopieVan(origineel);
            zonder.image = null;
            service.create(zonder).subscribe();
            const tweede = http.expectOne(`${v2}wishes/origineel/copies`);
            expect(tweede.request.body.image).toBeNull();
            tweede.flush(apiWish({ id: 'k2' }), { status: 201, statusText: 'Created' });
        });
    });

    describe('update', () => {
        it('PATCH met alleen wat verandert (JSON Merge Patch) en werkt de lijst bij', () => {
            const [wens] = laadLijst('w1', 'w2');
            const aangepast = Object.assign(new Wish(wens.id, 'Nieuw boek', 20, wens.url, wens.receiver, wens.createdBy, null, null, null, 1), { links: wens.links });
            aangepast.image = { key: 'wishes/b.jpg', url: 'https://img.gimmi.be/wishes/b.jpg' };
            service.update(aangepast).subscribe();
            const patch = http.expectOne(`${v2}wishes/w1`);
            expect(patch.request.method).toBe('PATCH');
            expect(patch.request.headers.get('Content-Type')).toBe('application/merge-patch+json');
            expect(patch.request.body).toEqual({ title: 'Nieuw boek', image: { key: 'wishes/b.jpg' } });
            patch.flush(apiWish({ id: 'w1', title: 'Nieuw boek', image: { key: 'wishes/b.jpg', url: 'https://img.gimmi.be/wishes/b.jpg' } }));
            expect(huidigeLijst()[0].title).toBe('Nieuw boek');
            expect(huidigeLijst()[0].image.key).toBe('wishes/b.jpg');
        });

        it('leeg maken stuurt null; de prijs gaat in centen', () => {
            const [wens] = laadLijst('w1');
            const aangepast = Object.assign(new Wish(wens.id, wens.title, 5.5, wens.url, wens.receiver, wens.createdBy, null, null, null, 1), { links: wens.links });
            service.update(aangepast).subscribe();
            const patch = http.expectOne(`${v2}wishes/w1`);
            expect(patch.request.body).toEqual({ price: { amount: 550, currency: 'EUR' } });
            patch.flush(apiWish({ id: 'w1' }));

            const zonderLink = Object.assign(new Wish(wens.id, wens.title, wens.price, '', wens.receiver, wens.createdBy, null, null, null, 1), { links: wens.links });
            zonderLink.url = '';
            service.update(zonderLink).subscribe();
            const tweede = http.expectOne(`${v2}wishes/w1`);
            expect(tweede.request.body).toEqual({ links: [] });
            tweede.flush(apiWish({ id: 'w1', links: [] }));
        });

        it('de links die het formulier niet toont blijven bewaard', () => {
            service.getWishlist(ria).subscribe();
            http.expectOne(`${v2}people/ria/wishes?limit=100`).flush(page([apiWish({ id: 'w1', links: [{ url: 'https://een.be' }, { url: 'https://twee.be' }] })]));
            const wens = huidigeLijst()[0];
            const aangepast = Object.assign(new Wish(wens.id, wens.title, wens.price, 'https://nieuw.be', wens.receiver, wens.createdBy, null, null, null, 1), { links: wens.links });
            service.update(aangepast).subscribe();
            const patch = http.expectOne(`${v2}wishes/w1`);
            expect(patch.request.body).toEqual({ links: [{ url: 'https://nieuw.be' }, { url: 'https://twee.be' }] });
            patch.flush(apiWish({ id: 'w1' }));
        });

        it('niets gewijzigd: geen request', () => {
            const [wens] = laadLijst('w1');
            let uitkomst: Wish;
            service.update(Object.assign(new Wish(wens.id, wens.title, wens.price, wens.url, wens.receiver, wens.createdBy, null, null, null, 1), { links: wens.links })).subscribe(w => uitkomst = w);
            expect(uitkomst).toBe(wens);
        });

        it('wish-fulfilled (409) wordt gemeld en de lijst blijft staan', () => {
            const [wens] = laadLijst('w1');
            const aangepast = Object.assign(new Wish(wens.id, 'Anders', wens.price, wens.url, wens.receiver, wens.createdBy, null, null, null, 1), { links: wens.links });
            const gelukt = vi.fn();
            service.update(aangepast).subscribe(gelukt);
            flushProblem(`${v2}wishes/w1`, 409, 'wish-fulfilled');
            expect(gelukt).not.toHaveBeenCalled();
            expect(problems.show).toHaveBeenCalledTimes(1);
            expect(huidigeLijst()[0].title).toBe('Boek');
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
