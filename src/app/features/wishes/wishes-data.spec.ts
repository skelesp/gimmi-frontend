import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { problemInterceptor } from 'src/app/core/api/problem-interceptor';

import { environment } from 'src/environments/environment';
import type { Schema } from 'src/app/core/api/api-types';
import { Wish, WishDraft } from './wish';
import { apiWish } from './wish.testing';
import { ProblemNotifier } from 'src/app/core/api/problem-notifier';
import { WishesData, toDraft } from './wishes-data';

// Pins down how the app talks to the wish and wishlist API (sc-2979). Reading, creating, changing, deleting
// and copying go through API v2 (sc-3288, sc-3289): creating a wish (sc-1977), deleting (sc-1981), copies (sc-2348).
// Reserving (sc-1979), removing a reservation (sc-2515) and confirming the gift with feedback (sc-1980, sc-2442) also
// go through API v2 since sc-3291.
describe('WishesData', () => {
    const v2 = environment.apiV2Url;
    let service: WishesData;
    let http: HttpTestingController;

        let problems: { show: ReturnType<typeof vi.fn> };

    function newWish(): WishDraft {
        return { title: 'Boek', price: 20, url: 'boek.be', color: '', size: '', description: '', image: null, copyOf: null };
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

    /** Lets the resources start a request, or take the answer of one. */
    async function flushAll() {
        TestBed.tick();
        await Promise.resolve();
        TestBed.tick();
    }

    /** Loads a list of wishes for `ria` through the page endpoint. */
    async function loadList(...ids: string[]): Promise<Wish[]> {
        service.showList('ria');
        await flushAll();
        http.expectOne(`${v2}people/ria/wishes?limit=100`).flush(page(ids.map(id => apiWish({ id }))));
        await flushAll();
        return service.wishes();
    }

    function currentList(): Wish[] {
        return service.wishes();
    }

    describe('getWishlist', () => {
        it('one request per page; sets the recipient', async () => {
            service.showList('ria');
            await flushAll();
            expect(service.listLoading()).toBe(true);
            http.expectOne(`${v2}people/ria/wishes?limit=100`).flush(page([apiWish({ id: 'w1' }), apiWish({ id: 'w2' })]));
            await flushAll();
            expect(service.listLoading()).toBe(false);
            expect(currentList().map(w => w.id)).toEqual(['w1', 'w2']);
            expect(service.currentReceiverId()).toBe('ria');
        });

        it('fetches all pages until there is no nextCursor any more', async () => {
            service.showList('ria');
            await flushAll();
            http.expectOne(`${v2}people/ria/wishes?limit=100`).flush(page([apiWish({ id: 'w1' })], 'c1'));
            http.expectOne(`${v2}people/ria/wishes?limit=100&cursor=c1`).flush(page([apiWish({ id: 'w2' })], 'c2'));
            http.expectOne(`${v2}people/ria/wishes?limit=100&cursor=c2`).flush(page([apiWish({ id: 'w3' })]));
            await flushAll();
            expect(currentList().map(w => w.id)).toEqual(['w1', 'w2', 'w3']);
        });

        it('an empty list gives an empty array', async () => {
            expect(await loadList()).toEqual([]);
        });

        it('no longer makes separate calls per wish (no status, no people)', async () => {
            await loadList('w1', 'w2', 'w3');
            http.verify();
        });

        it('an error from the server comes through', async () => {
            service.showList('ria');
            await flushAll();
            http.expectOne(`${v2}people/ria/wishes?limit=100`).flush({ status: 404 }, { status: 404, statusText: 'Not Found' });
            await flushAll();
            expect(service.listError()).toBeTruthy();
            expect(service.listLoading()).toBe(false);
            expect(currentList()).toEqual([]);
        });
    });

    describe('reservatie', () => {
        it('addReservation: PUT /wishes/{id}/reservation with date and occasion; the wish in the list follows the answer', async () => {
            const [wish] = await loadList('w1');
            let updated: Wish;
            service.addReservation(wish, { handoverDate: '2026-12-24', occasion: 'birthday' }).subscribe(w => updated = w);
            const req = http.expectOne(`${v2}wishes/w1/reservation`);
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual({ handoverDate: '2026-12-24', occasion: 'birthday' });
            req.flush(apiWish({ id: 'w1', status: 'reserved', reservation: { reservedBy: { id: 'rob', firstName: 'Rob', lastName: 'Reservator' } } }));
            expect(updated.status).toBe('reserved');
            expect(currentList()[0].status).toBe('reserved');
        });

        it('addReservation: a second giver is too late (409): notice, no value, the wish is read again', async () => {
            const [wish] = await loadList('w1');
            const value = vi.fn();
            service.addReservation(wish, { handoverDate: '2026-12-24', occasion: 'other' }).subscribe(value);
            flushProblem(`${v2}wishes/w1/reservation`, 409, 'wish-already-reserved');
            expect(problems.show).toHaveBeenCalledTimes(1);
            http.expectOne(`${v2}wishes/w1`).flush(apiWish({ id: 'w1', status: 'reserved' }));
            expect(value).not.toHaveBeenCalled();
            expect(currentList()[0].status).toBe('reserved');
        });

        it('addReservation: another error (422): notice and no new read', async () => {
            const [wish] = await loadList('w1');
            service.addReservation(wish, { handoverDate: '2026-12-24', occasion: 'other' }).subscribe();
            flushProblem(`${v2}wishes/w1/reservation`, 422, 'date-in-future');
            expect(problems.show).toHaveBeenCalledTimes(1);
        });

        it('deleteReservation: DELETE /wishes/{id}/reservation (204), then a read: the wish is open again', async () => {
            const [wish] = await loadList('w1');
            let updated: Wish;
            service.deleteReservation(wish).subscribe(w => updated = w);
            const req = http.expectOne(`${v2}wishes/w1/reservation`);
            expect(req.request.method).toBe('DELETE');
            req.flush(null, { status: 204, statusText: 'No Content' });
            http.expectOne(`${v2}wishes/w1`).flush(apiWish({ id: 'w1', status: 'open' }));
            expect(updated.reservation).toBeNull();
            expect(updated.status).toBe('open');
        });

        it('deleteReservation: an error (403) is reported', async () => {
            const [wish] = await loadList('w1');
            service.deleteReservation(wish).subscribe();
            flushProblem(`${v2}wishes/w1/reservation`, 403, 'forbidden');
            expect(problems.show).toHaveBeenCalledTimes(1);
        });
    });

    describe('fulfill', () => {
        const feedback = { receivedOn: '2026-10-05', satisfaction: 4, message: 'dank je', putBackOnList: false };
        const fulfilled = (fulfillment: Record<string, unknown> = {}) => apiWish({
            id: 'w1', status: 'fulfilled',
            fulfillment: { receivedOn: '2026-10-05', givenBy: null, satisfaction: 4, message: 'dank je', fulfilledAt: '2026-10-05T10:00:00Z', ...fulfillment }
        });

        it('PUT /wishes/{id}/fulfillment with everything in one call; the wish in the list follows the answer', async () => {
            const [wish] = await loadList('w1');
            let updated: Wish;
            service.fulfill(wish, feedback).subscribe(w => updated = w);
            const req = http.expectOne(`${v2}wishes/w1/fulfillment`);
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual(feedback);
            req.flush(fulfilled());
            expect(updated.fulfillment.message).toBe('dank je');
            expect(currentList()[0].status).toBe('fulfilled');
        });

        it('an empty message is sent as null', async () => {
            const [wish] = await loadList('w1');
            service.fulfill(wish, { ...feedback, message: '  ' }).subscribe();
            const req = http.expectOne(`${v2}wishes/w1/fulfillment`);
            expect(req.request.body.message).toBeNull();
            req.flush(fulfilled());
        });

        it('putBackOnList: the wish the server put back comes at the top of the list, without own copy', async () => {
            const [wish] = await loadList('w1');
            let updated: Wish;
            service.fulfill(wish, { ...feedback, putBackOnList: true }).subscribe(w => updated = w);
            http.expectOne(`${v2}wishes/w1/fulfillment`).flush(fulfilled({ relistedWishId: 'w9' }));
            http.expectOne(`${v2}wishes/w9`).flush(apiWish({ id: 'w9', status: 'open' }));
            expect(currentList().map(w => w.id)).toEqual(['w9', 'w1']);
            expect(updated.id).toBe('w1');
        });

        it('putBackOnList: if reading the new wish fails, the confirming still succeeded', async () => {
            const [wish] = await loadList('w1');
            let updated: Wish;
            service.fulfill(wish, { ...feedback, putBackOnList: true }).subscribe(w => updated = w);
            http.expectOne(`${v2}wishes/w1/fulfillment`).flush(fulfilled({ relistedWishId: 'w9' }));
            http.expectOne(`${v2}wishes/w9`).flush({}, { status: 500, statusText: 'Error' });
            expect(updated.id).toBe('w1');
        });

        it('an error (date-in-future) is reported and gives no value', async () => {
            const [wish] = await loadList('w1');
            const value = vi.fn();
            service.fulfill(wish, feedback).subscribe(value);
            flushProblem(`${v2}wishes/w1/fulfillment`, 422, 'date-in-future');
            expect(problems.show).toHaveBeenCalledTimes(1);
            expect(value).not.toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('DELETE /wishes/{id} and removes the wish from the list; the server cleans up the image (sc-3052)', async () => {
            const [wish] = await loadList('w1', 'w2');
            let removed: Wish;
            service.delete(wish).subscribe(w => removed = w);
            const req = http.expectOne(`${v2}wishes/w1`);
            expect(req.request.method).toBe('DELETE');
            req.flush(null, { status: 204, statusText: 'No Content' });
            expect(removed).toBe(wish);
            expect(currentList().map(w => w.id)).toEqual(['w2']);
        });

        it('an error from the server is reported and leaves the list', async () => {
            const [wish] = await loadList('w1');
            const succeeded = vi.fn();
            service.delete(wish).subscribe(succeeded);
            flushProblem(`${v2}wishes/w1`, 403, 'forbidden');
            expect(succeeded).not.toHaveBeenCalled();
            expect(problems.show).toHaveBeenCalledTimes(1);
            expect(currentList().map(w => w.id)).toEqual(['w1']);
        });
    });

    describe('create', () => {
        it('POST /people/{recipient}/wishes with amounts in cents and links as a list, and puts the wish at the top', async () => {
            await loadList('w0');
            const wish = { ...newWish(), image: { key: 'wishes/a.jpg', url: 'https://img.gimmi.be/wishes/a.jpg' }, price: 12.34 };
            let createdWish: Wish;
            service.create(wish, 'ria').subscribe(w => createdWish = w);

            const post = http.expectOne(`${v2}people/ria/wishes`);
            expect(post.request.method).toBe('POST');
            expect(post.request.body).toEqual({
                title: 'Boek', description: null, price: { amount: 1234, currency: 'EUR' }, links: [{ url: 'http://boek.be' }],
                image: { key: 'wishes/a.jpg' }, color: null, size: null
            });
            post.flush(apiWish({ id: 'w1', image: { key: 'wishes/a.jpg', url: 'https://img.gimmi.be/wishes/a.jpg' } }), { status: 201, statusText: 'Created' });
            expect(currentList().map(w => w.id)).toEqual(['w1', 'w0']);
            expect(createdWish.id).toBe('w1');
            expect(createdWish.image).toEqual({ key: 'wishes/a.jpg', url: 'https://img.gimmi.be/wishes/a.jpg' });
        });

        it('without price, link and image: null, an empty list and no key', async () => {
            await loadList();
            const wish: WishDraft = { ...newWish(), price: null, url: '' };
            service.create(wish, 'ria').subscribe();
            const post = http.expectOne(`${v2}people/ria/wishes`);
            expect(post.request.body).toMatchObject({ price: null, links: [], image: null });
            post.flush(apiWish({ id: 'w1' }), { status: 201, statusText: 'Created' });
        });

        it('passes on a new array, so a signal on the list sees the change (sc-3323)', async () => {
            await loadList('w0');
            const first = currentList();
            service.create(newWish(), 'ria').subscribe();
            http.expectOne(`${v2}people/ria/wishes`).flush(apiWish({ id: 'w1' }), { status: 201, statusText: 'Created' });
            expect(currentList()).not.toBe(first);
        });

        it('an error from the server (e.g. image not found) is reported, without adding a wish', async () => {
            await loadList('w0');
            const succeeded = vi.fn();
            service.create(newWish(), 'ria').subscribe(succeeded);
            flushProblem(`${v2}people/ria/wishes`, 422, 'image-not-found');
            expect(succeeded).not.toHaveBeenCalled();
            expect(problems.show).toHaveBeenCalledTimes(1);
            expect(currentList().map(w => w.id)).toEqual(['w0']);
        });
    });

    describe('copy (create with copyOf)', () => {
        function makeCopy(original: Wish): WishDraft {
            return { ...newWish(), copyOf: original.id, image: original.image };
        }

        it('POST /wishes/{original}/copies, the image is shared (not sent along) and the original knows about the copy', async () => {
            const [original] = await loadList('origineel');
            expect(original.viewer.ownCopyId).toBeNull();
            let copy: Wish;
            service.create(makeCopy(original), 'ria').subscribe(w => copy = w);
            const post = http.expectOne(`${v2}wishes/origineel/copies`);
            expect(post.request.body).toEqual({
                title: 'Boek', description: null, price: { amount: 2000, currency: 'EUR' }, links: [{ url: 'http://boek.be' }], color: null, size: null
            });
            post.flush(apiWish({ id: 'k1', copyOf: 'origineel' }), { status: 201, statusText: 'Created' });
            expect(copy.copyOf).toBe('origineel');
            expect(currentList().find(w => w.id === 'origineel').viewer.ownCopyId).toBe('k1');
        });

        it('another image in the popup is sent along, and removing it as null', async () => {
            const [original] = await loadList('origineel');
            original.image = { key: 'wishes/a.jpg', url: 'u' };
            const other = { ...makeCopy(original), image: { key: 'wishes/b.jpg', url: 'u' } };
            service.create(other, 'ria').subscribe();
            const first = http.expectOne(`${v2}wishes/origineel/copies`);
            expect(first.request.body.image).toEqual({ key: 'wishes/b.jpg' });
            first.flush(apiWish({ id: 'k1' }), { status: 201, statusText: 'Created' });

            const without: WishDraft = { ...makeCopy(original), image: null };
            service.create(without, 'ria').subscribe();
            const second = http.expectOne(`${v2}wishes/origineel/copies`);
            expect(second.request.body.image).toBeNull();
            second.flush(apiWish({ id: 'k2' }), { status: 201, statusText: 'Created' });
        });
    });

    describe('update', () => {
        it('PATCH with only what changes (JSON Merge Patch) and updates the list', async () => {
            const [wish] = await loadList('w1', 'w2');
            const changed = { ...toDraft(wish), title: 'Nieuw boek', image: { key: 'wishes/b.jpg', url: 'https://img.gimmi.be/wishes/b.jpg' } };
            service.update(wish, changed).subscribe();
            const patch = http.expectOne(`${v2}wishes/w1`);
            expect(patch.request.method).toBe('PATCH');
            expect(patch.request.headers.get('Content-Type')).toBe('application/merge-patch+json');
            expect(patch.request.body).toEqual({ title: 'Nieuw boek', image: { key: 'wishes/b.jpg' } });
            patch.flush(apiWish({ id: 'w1', title: 'Nieuw boek', image: { key: 'wishes/b.jpg', url: 'https://img.gimmi.be/wishes/b.jpg' } }));
            expect(currentList()[0].title).toBe('Nieuw boek');
            expect(currentList()[0].image.key).toBe('wishes/b.jpg');
        });

        it('clearing sends null; the price goes in cents', async () => {
            const [wish] = await loadList('w1');
            service.update(wish, { ...toDraft(wish), price: 5.5 }).subscribe();
            const patch = http.expectOne(`${v2}wishes/w1`);
            expect(patch.request.body).toEqual({ price: { amount: 550, currency: 'EUR' } });
            patch.flush(apiWish({ id: 'w1' }));

            service.update(wish, { ...toDraft(wish), url: '' }).subscribe();
            const second = http.expectOne(`${v2}wishes/w1`);
            expect(second.request.body).toEqual({ links: [] });
            second.flush(apiWish({ id: 'w1', links: [] }));
        });

        it('the links the form does not show are kept', async () => {
            service.showList('ria');
            await flushAll();
            http.expectOne(`${v2}people/ria/wishes?limit=100`).flush(page([apiWish({ id: 'w1', links: [{ url: 'https://een.be' }, { url: 'https://twee.be' }] })]));
            await flushAll();
            const wish = currentList()[0];
            service.update(wish, { ...toDraft(wish), url: 'https://nieuw.be' }).subscribe();
            const patch = http.expectOne(`${v2}wishes/w1`);
            expect(patch.request.body).toEqual({ links: [{ url: 'https://nieuw.be' }, { url: 'https://twee.be' }] });
            patch.flush(apiWish({ id: 'w1' }));
        });

        it('nothing changed: no request', async () => {
            const [wish] = await loadList('w1');
            let outcome: Wish;
            service.update(wish, toDraft(wish)).subscribe(w => outcome = w);
            expect(outcome).toBe(wish);
        });

        it('wish-fulfilled (409) is reported and the list stays', async () => {
            const [wish] = await loadList('w1');
            const succeeded = vi.fn();
            service.update(wish, { ...toDraft(wish), title: 'Anders' }).subscribe(succeeded);
            flushProblem(`${v2}wishes/w1`, 409, 'wish-fulfilled');
            expect(succeeded).not.toHaveBeenCalled();
            expect(problems.show).toHaveBeenCalledTimes(1);
            expect(currentList()[0].title).toBe('Boek');
        });
    });

    describe('select', () => {
        it('wish from the loaded list: no request', async () => {
            await loadList('w1');
            service.select('w1');
            await flushAll();
            expect(service.selectedWish().id).toBe('w1');
        });

        it('unknown wish: one request to v2, with the recipient added', async () => {
            service.select('w5');
            await flushAll();
            expect(service.selectedLoading()).toBe(true);
            expect(service.selectedWish()).toBeNull();
            http.expectOne(`${v2}wishes/w5`).flush(apiWish({ id: 'w5' }));
            await flushAll();
            expect(service.selectedWish().id).toBe('w5');
            expect(service.selectedWish().receiver.firstName).toBe('Ria');
        });

        it('without id: nothing to show', async () => {
            service.select('');
            await flushAll();
            expect(service.selectedWish()).toBeNull();
        });

        it('a wish that does not exist (404): nothing to show', async () => {
            service.select('weg');
            await flushAll();
            http.expectOne(`${v2}wishes/weg`).flush({ status: 404 }, { status: 404, statusText: 'Not Found' });
            await flushAll();
            expect(service.selectedWish()).toBeNull();
            expect(service.selectedLoading()).toBe(false);
        });
    });

    describe('the wish on the wish page (not in the list)', () => {
        it('a copy of the selected wish compares the image with that wish and marks it as copied', async () => {
            service.select('w5');
            await flushAll();
            http.expectOne(`${v2}wishes/w5`).flush(apiWish({ id: 'w5', image: { key: 'wishes/a.jpg', url: 'u' } }));
            await flushAll();
            const original = service.selectedWish();

            service.create({ ...newWish(), copyOf: 'w5', image: { key: 'wishes/a.jpg', url: 'u' } }, 'rob').subscribe();
            const post = http.expectOne(`${v2}wishes/w5/copies`);
            expect(post.request.body.image).toBeUndefined();
            post.flush(apiWish({ id: 'k1', copyOf: 'w5' }), { status: 201, statusText: 'Created' });

            expect(service.selectedWish().viewer.ownCopyId).toBe('k1');
            expect(original.viewer.ownCopyId).toBeNull();
        });

        it('a change in the list also updates the selected wish', async () => {
            const [wish] = await loadList('w1');
            service.select('w1');
            await flushAll();
            service.addReservation(wish, { handoverDate: '2026-12-24', occasion: 'other' }).subscribe();
            http.expectOne(`${v2}wishes/w1/reservation`).flush(apiWish({ id: 'w1', status: 'reserved' }));
            expect(service.selectedWish().status).toBe('reserved');
        });

        it('a change to a wish that is not in the list leaves the list as it was', async () => {
            await loadList('w1');
            service.deleteReservation(apiWish({ id: 'ander' })).subscribe();
            http.expectOne(`${v2}wishes/ander/reservation`).flush(null, { status: 204, statusText: 'No Content' });
            http.expectOne(`${v2}wishes/ander`).flush(apiWish({ id: 'ander' }));
            expect(currentList().map(w => w.id)).toEqual(['w1']);
        });

        it('a wish of someone else does not end up on the loaded list', async () => {
            await loadList('w1');
            service.create(newWish(), 'rob').subscribe();
            http.expectOne(`${v2}people/rob/wishes`).flush(apiWish({ id: 'w2', receiver: { id: 'rob', firstName: 'Rob', lastName: 'R' } }), { status: 201, statusText: 'Created' });
            expect(currentList().map(w => w.id)).toEqual(['w1']);
        });

        it('an error that is not an ApiProblem comes through and is not reported', async () => {
            const [wish] = await loadList('w1');
            const error = vi.fn();
            service.delete(wish).subscribe({ error: error });
            http.expectOne(`${v2}wishes/w1`).error(new ProgressEvent('error'));
            expect(error).toHaveBeenCalled();
            expect(problems.show).not.toHaveBeenCalled();
        });
    });

    describe('toDraft', () => {
        it('a wish without price, description, colour and size gives empty fields', async () => {
            const concept = toDraft(apiWish({ price: null, links: [], description: null, color: null, size: null }));
            expect(concept).toMatchObject({ price: null, url: '', description: '', color: '', size: '', image: null, copyOf: null });
        });
    });
});
