import type { Schema } from 'src/app/core/api/api-types';
import { Wish } from './wish.model';

type ApiWish = Schema<'Wish'>;

/** A wish as API v2 returns it, for specs: an open wish of Ria on her own list. Override what the spec cares about. */
export function apiWish(overrides: Partial<Omit<ApiWish, 'viewer'>> & { viewer?: Partial<ApiWish['viewer']> } = {}): ApiWish {
  const { viewer, ...rest } = overrides;
  return {
    id: 'w1',
    title: 'Boek',
    description: null,
    price: { amount: 2000, currency: 'EUR' },
    links: [{ url: 'https://boek.be' }],
    image: null,
    color: null,
    size: null,
    receiver: { id: 'ria', firstName: 'Ria', lastName: 'Receiver' },
    createdBy: { id: 'ria', firstName: 'Ria', lastName: 'Receiver' },
    copyOf: null,
    status: 'open',
    reservation: null,
    fulfillment: null,
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-01T10:00:00Z',
    ...rest,
    viewer: {
      roles: ['other'],
      can: { update: false, delete: false, copy: true, reserve: true, unreserve: false, fulfill: false, unfulfill: false },
      ownCopyId: null,
      ...viewer
    }
  };
}

/**
 * Makes `userId` the viewer of the wish, with the roles and rights the server would give: the receiver and the
 * creator may change and delete it, the receiver does not copy it, the giver is the one who reserved it.
 */
export function viewWishAs(wish: Wish, userId: string): void {
  const roles: Schema<'WishViewer'>['roles'] = [];
  if (userId === wish.receiver.id) roles.push('receiver');
  if (userId === wish.createdBy.id) roles.push('creator');
  if (userId === wish.reservation?.reservedBy.id) roles.push('giver');
  const receiver = roles.includes('receiver');
  const mayChange = receiver || roles.includes('creator');
  wish.viewer = {
    roles: roles.length ? roles : ['other'],
    can: { update: mayChange, delete: mayChange, copy: !receiver, reserve: false, unreserve: false, fulfill: false, unfulfill: false },
    ownCopyId: null
  };
}
