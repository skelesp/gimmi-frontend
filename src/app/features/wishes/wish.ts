import type { Schema } from 'src/app/core/api/api-types';
import { validateUrl } from 'src/app/core/url-utility';

/** A wish as API v2 returns it: components and templates work on the contract type. */
export type Wish = Schema<'Wish'>;
export type WishStatus = Schema<'WishStatus'>;
export type WishImage = Schema<'Image'>;
type ViewerRole = Schema<'WishViewer'>['roles'][number];
type ViewerAction = 'update' | 'delete' | 'copy';

/** What the wish popup hands over: the fields as the form shows them (euros, one link). */
export interface WishDraft {
  title: string;
  price: number | null;
  url: string;
  color: string;
  size: string;
  description: string;
  image: WishImage | null;
  /** The wish this is a copy of; `null` for a new wish. */
  copyOf: string | null;
}

/** The first link of the wish as an absolute address; `null` when it has none. The form shows this link only. */
export function wishUrl(wish: Pick<Wish, 'links'>): string | null {
  const first = wish.links[0]?.url;
  return first ? validateUrl(first) : null;
}

/** Whether the viewer may do this to the wish: the server says so (`viewer.can`). */
export function canDo(wish: Wish, action: ViewerAction): boolean {
  return !!wish.viewer?.can[action];
}

/** What the viewer is to this wish, as the server says (`viewer.roles`). */
export function hasRole(wish: Wish, role: ViewerRole): boolean {
  return !!wish.viewer?.roles.includes(role);
}
