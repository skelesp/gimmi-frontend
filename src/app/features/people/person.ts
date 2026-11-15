import type { Schema } from 'src/app/core/api/api-types';

interface Named { firstName: string; lastName: string }

export const fullName = (person: Named): string => `${person.firstName} ${person.lastName}`;

/** What is needed to share someone; a logged-in user fits too. */
export type PersonToShare = Pick<Schema<'PersonRef'>, 'id' | 'firstName' | 'lastName'>;
