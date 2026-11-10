import type { Schema } from 'src/app/core/api/api-types';
import { Person } from 'src/app/people/models/person.model';
import { IClosure, IGiftFeedback, IReservation, Wish, wishStatus } from './wish.model';

const statuses: Record<Schema<'WishStatus'>, wishStatus> = {
  open: 'Open',
  reserved: 'Reserved',
  received: 'Received',
  fulfilled: 'Fulfilled'
};

const toPerson = (ref: Schema<'PersonRef'>) => new Person(ref.id, ref.firstName, ref.lastName);

/**
 * A wish of API v2 as the templates still want it: the `Wish` class with euros, one link and the
 * reservation and feedback in their old shape. A thin adapter; sc-2892 removes it by letting the templates
 * use the contract type and `viewer` directly.
 */
export function wishFromApi(api: Schema<'Wish'>): Wish {
  const wish = new Wish(
    api.id,
    api.title,
    api.price ? api.price.amount / 100 : null,
    api.links[0]?.url ?? null,
    toPerson(api.receiver),
    toPerson(api.createdBy),
    api.color,
    api.size,
    api.description,
    1
  );
  wish.createdAt = new Date(api.createdAt);
  wish.copyOf = api.copyOf;
  wish.image = api.image ? { key: api.image.key, url: api.image.url } : undefined;
  wish.status = statuses[api.status] ?? 'Open';

  if (api.reservation) {
    wish.reservation = {
      reservedBy: toPerson(api.reservation.reservedBy),
      amount: 1,
      reservationDate: api.reservation.reservedAt ? new Date(api.reservation.reservedAt) : null,
      reason: api.reservation.occasion ?? null,
      handoverDate: api.reservation.handoverDate ? new Date(api.reservation.handoverDate) : undefined
    } satisfies IReservation;
  }
  if (api.fulfillment) {
    wish.giftFeedback = {
      satisfaction: String(api.fulfillment.satisfaction ?? ''),
      receivedOn: new Date(api.fulfillment.receivedOn),
      message: api.fulfillment.message ?? null,
      putBackOnList: !!api.fulfillment.relistedWishId
    } satisfies IGiftFeedback;
    wish.closure = {
      closedBy: wish.receiver,
      closedOn: new Date(api.fulfillment.fulfilledAt),
      reason: 'Cadeau ontvangen'
    } satisfies IClosure;
  }
  wish.setViewer(api.viewer);
  return wish;
}
