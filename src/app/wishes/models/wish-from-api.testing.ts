import type { Schema } from 'src/app/core/api/api-types';

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
