import { wishFromApi } from './wish-from-api';
import { apiWish } from './wish-from-api.testing';

// De adapter van een wens van API v2 naar de Wish-klasse die de sjablonen nog gebruiken (sc-3288).
describe('wishFromApi', () => {
    it('zet de velden om: prijs in euro, eerste link, personen, afbeelding', () => {
        const w = wishFromApi(apiWish({
            price: { amount: 1250, currency: 'EUR' },
            links: [{ url: 'https://een.be' }, { url: 'https://twee.be' }],
            image: { key: 'wishes/a.jpg', url: 'https://img.gimmi.be/wishes/a.jpg' },
            color: 'zwart', size: 'M', description: 'liefst zwart', copyOf: 'orig'
        }));
        expect(w.price).toBe(12.5);
        expect(w.url).toBe('https://een.be');
        expect(w.receiver.fullName).toBe('Ria Receiver');
        expect(w.createdBy.id).toBe('ria');
        expect(w.image).toEqual({ key: 'wishes/a.jpg', url: 'https://img.gimmi.be/wishes/a.jpg' });
        expect([w.color, w.size, w.description, w.copyOf]).toEqual(['zwart', 'M', 'liefst zwart', 'orig']);
        expect(w.createdAt).toEqual(new Date('2026-10-01T10:00:00Z'));
    });

    it('zonder prijs, link en afbeelding: leeg', () => {
        const w = wishFromApi(apiWish({ price: null, links: [], image: null }));
        expect(w.price).toBeNull();
        expect(w.url).toBeNull();
        expect(w.image).toBeUndefined();
    });

    it.each([['open', 'Open'], ['reserved', 'Reserved'], ['received', 'Received'], ['fulfilled', 'Fulfilled']] as const)(
        'status %s wordt %s', (api, status) => {
            expect(wishFromApi(apiWish({ status: api })).status).toBe(status);
        });

    it('een onbekende status telt als Open', () => {
        expect(wishFromApi(apiWish({ status: 'archived' as never })).status).toBe('Open');
    });

    it('reservatie: wie, wanneer en de gelegenheid', () => {
        const w = wishFromApi(apiWish({
            status: 'reserved',
            reservation: { reservedBy: { id: 'rob', firstName: 'Rob', lastName: 'Reservator' }, reservedAt: '2026-10-02T08:00:00Z', handoverDate: '2026-12-25', occasion: 'christmas' }
        }));
        expect(w.reservation.reservedBy.fullName).toBe('Rob Reservator');
        expect(w.reservation.reservationDate).toEqual(new Date('2026-10-02T08:00:00Z'));
        expect(w.reservation.handoverDate).toEqual(new Date('2026-12-25'));
        expect(w.reservation.reason).toBe('christmas');
    });

    it('zonder reservatie (of verborgen voor de ontvanger): geen reservation', () => {
        expect(wishFromApi(apiWish()).reservation).toBeUndefined();
        expect(wishFromApi(apiWish({ reservation: undefined })).reservation).toBeUndefined();
    });

    it('fulfillment wordt feedback en afsluiting', () => {
        const w = wishFromApi(apiWish({
            status: 'fulfilled',
            fulfillment: { receivedOn: '2026-10-05', givenBy: null, satisfaction: 5, message: 'super', relistedWishId: 'nieuw', fulfilledAt: '2026-10-06T09:00:00Z' }
        }));
        expect(w.giftFeedback).toEqual({ satisfaction: '5', receivedOn: new Date('2026-10-05'), message: 'super', putBackOnList: true, relistedWishId: 'nieuw' });
        expect(w.closure.closedOn).toEqual(new Date('2026-10-06T09:00:00Z'));
        expect(w.closure.closedBy.id).toBe('ria');
    });

    it('rollen en rechten komen van de server, niet van id-vergelijking', () => {
        const w = wishFromApi(apiWish({ viewer: { roles: ['receiver', 'creator'], can: { update: true, delete: true, copy: false, reserve: false, unreserve: false, fulfill: true, unfulfill: false } } }));
        expect([w.userIsReceiver, w.userIsCreator, w.userIsReservator]).toEqual([true, true, false]);
        expect(w.viewer.can.update).toBe(true);
        expect(wishFromApi(apiWish({ viewer: { roles: ['giver'] } })).userIsReservator).toBe(true);
    });

    it('scenario volgt de status voor de kijker: een gereserveerde wens ziet de ontvanger als open', () => {
        const forReceiver = wishFromApi(apiWish({ status: 'open', viewer: { roles: ['receiver', 'creator'] } }));
        expect(forReceiver.scenario).toBe('OPEN_WISH');
        const forGiver = wishFromApi(apiWish({ status: 'reserved', viewer: { roles: ['giver'] } }));
        expect(forGiver.scenario).toBe('RESERVED_BY_USER');
    });
});
