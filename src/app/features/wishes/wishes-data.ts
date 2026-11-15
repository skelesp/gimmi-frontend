import { Service, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, expand, map, reduce, switchMap, tap } from 'rxjs/operators';

import { ApiClient } from 'src/app/core/api/api-client';
import { ApiProblem } from 'src/app/core/api/api-problem';
import { ProblemNotifier } from 'src/app/core/api/problem-notifier';
import { validateUrl } from 'src/app/core/url-utility';
import type { Schema } from 'src/app/core/api/api-types';
import { Wish, WishDraft, wishUrl } from './wish';

// A page holds at most 100 wishes; a list is read to the end (there is no "load more" yet).
const pageSize = 100;

/**
 * Everything about wishes goes to API v2. Reading is done by two resources (the list that is shown and the wish
 * of the wish page); a write puts its answer in them, so the screen follows without reading again.
 */
@Service()
export class WishesData {
  private api = inject(ApiClient);
  private problems = inject(ProblemNotifier);

  private readonly receiverId = signal<string | undefined>(undefined);
  /** The person whose list is shown. */
  readonly currentReceiverId = this.receiverId.asReadonly();
  private readonly list = rxResource({
    params: () => this.receiverId(),
    stream: ({ params }) => this.readList(params),
    defaultValue: [] as Wish[]
  });
  /** The wishes of the list that is shown; none while it loads or when it could not be read. */
  readonly wishes = computed(() => this.list.hasValue() ? this.list.value() : []);
  readonly listLoading = this.list.isLoading;
  /** Why the list could not be read; `undefined` when it could. */
  readonly listError = this.list.error;

  private readonly selectedId = signal<string | undefined>(undefined);
  // A wish that is on the list on screen is not read again.
  private readonly idToRead = computed(() => {
    const id = this.selectedId();
    return id && !this.wishes().some(wish => wish.id === id) ? id : undefined;
  });
  private readonly readWish = rxResource({
    params: () => this.idToRead(),
    stream: ({ params }) => this.fetchWish(params)
  });
  /** The wish the wish page shows: from the list, or read on its own; `null` while it loads or when it cannot be shown. */
  readonly selectedWish = computed(() => {
    const id = this.selectedId();
    const read = this.readWish.hasValue() ? this.readWish.value() : undefined;
    return this.wishes().find(wish => wish.id === id) ?? (id && read?.id === id ? read : null);
  });
  readonly selectedLoading = this.readWish.isLoading;

  /** Shows the list of this person; it is read to the end, page by page. */
  public showList(receiverId: string): void {
    this.receiverId.set(receiverId);
  }

  /** Shows this wish on the wish page. */
  public select(wishId: string | null | undefined): void {
    this.selectedId.set(wishId || undefined);
  }

  private readList(receiverId: string): Observable<Wish[]> {
    const page = (cursor?: string) => this.api.get('/people/{personId}/wishes', {
      path: { personId: receiverId },
      query: { limit: pageSize, cursor }
    });
    return page().pipe(
      expand(wishPage => wishPage.nextCursor ? page(wishPage.nextCursor) : EMPTY),
      reduce((items, wishPage) => [...items, ...wishPage.items], [] as Wish[])
    );
  }

  /** Reserves the wish for the viewer, or changes the viewer's own reservation. The giver comes from the token. */
  public addReservation(wish: Wish, reservation: { handoverDate: string; occasion: Schema<'Occasion'> }) : Observable<Wish> {
    return this.api.put('/wishes/{wishId}/reservation', { path: { wishId: wish.id }, body: reservation }).pipe(
      tap(reserved => this.replaceInView(reserved)),
      this.showProblem(() => this.reloadWish(wish))
    );
  }

  public deleteReservation(wish: Wish) : Observable<Wish> {
    return this.api.delete('/wishes/{wishId}/reservation', { path: { wishId: wish.id } }).pipe(
      switchMap(() => this.reloadWish(wish)),
      this.showProblem()
    );
  }

  public delete (wish: Wish) : Observable<Wish>{
    return this.api.delete('/wishes/{wishId}', { path: { wishId: wish.id } }).pipe(
      // The server removes the image when no other wish uses it (sc-3052).
      map(() => wish),
      tap(wish => this.deleteWishFromWishlist(wish)),
      this.showProblem()
    );
  }

  /**
   * The receiver confirms the gift with feedback (one call). With `putBackOnList` the server creates the new wish
   * on the list and mails the thank-you message to the giver; the client does neither.
   */
  public fulfill (wish: Wish, feedback: Schema<'FulfillmentRequest'>) : Observable<Wish> {
    return this.api.put('/wishes/{wishId}/fulfillment', {
      path: { wishId: wish.id },
      body: { ...feedback, message: blankToNull(feedback.message) }
    }).pipe(
      tap(fulfilled => this.replaceInView(fulfilled)),
      switchMap(fulfilled => this.addRelistedWish(fulfilled)),
      this.showProblem()
    );
  }

  /** Adds the wish that the server put back on the list to the list on screen; gives back the fulfilled wish. */
  private addRelistedWish (fulfilled: Wish) : Observable<Wish> {
    const relistedId = fulfilled.fulfillment?.relistedWishId;
    if (!relistedId) return of(fulfilled);
    return this.fetchWish(relistedId).pipe(
      tap(relisted => this.addWishToWishlist(relisted)),
      map(() => fulfilled),
      catchError(() => of(fulfilled))
    );
  }

  /** Adds the wish to the list of `receiverId`; with `copyOf` it is a copy of that wish on the list of the viewer. */
  public create ( draft : WishDraft, receiverId: string) : Observable<Wish>{
    const created = draft.copyOf
      ? this.api.post('/wishes/{wishId}/copies', { path: { wishId: draft.copyOf }, body: this.copyBody(draft) })
      : this.api.post('/people/{personId}/wishes', { path: { personId: receiverId }, body: this.createBody(draft) });
    return created.pipe(
      tap(wish => {
        this.addWishToWishlist(wish);
        if (draft.copyOf) this.markCopied(draft.copyOf, wish.id);
      }),
      this.showProblem()
    );
  }

  /** Sends only what differs between the wish and the draft (JSON Merge Patch). */
  public update ( wish : Wish, draft: WishDraft ) : Observable<Wish>{
    const changes = this.changesTo(wish, draft);
    if (Object.keys(changes).length === 0) return of(wish);
    return this.api.patch('/wishes/{wishId}', { path: { wishId: wish.id }, body: changes }).pipe(
      tap(updated => this.replaceInView(updated)),
      this.showProblem()
    );
  }

  /* PRIVATE methods */
  private fetchWish (wishId: string) : Observable<Wish> {
    return this.api.get('/wishes/{wishId}', { path: { wishId } });
  }

  /** Reads the wish again after a write, and puts the fresh version in the list. */
  private reloadWish (wish: Wish) : Observable<Wish> {
    return this.fetchWish(wish.id).pipe(tap(updated => this.replaceInView(updated)));
  }

  /** The viewer now has a copy of this wish on their list: the "already on your list" warning follows. */
  private markCopied (originalId: string, copyId: string) : void {
    const original = this.findKnownWish(originalId);
    if (original) this.replaceInView({ ...original, viewer: { ...original.viewer, ownCopyId: copyId } });
  }

  /** Shows an `ApiProblem` as a toast and ends the stream without a value, so the "it worked" messages stay away. */
  private showProblem<T>(afterwards?: () => Observable<unknown>) {
    return catchError<T, Observable<never>>(error => {
      if (!(error instanceof ApiProblem)) throw error;
      this.problems.show(error);
      // E.g. a second giver was too late: read the wish again so the screen shows who reserved it.
      return afterwards && error.status === 409 ? afterwards().pipe(switchMap(() => EMPTY)) : EMPTY;
    });
  }

  private findKnownWish (wishId: string) : Wish | undefined {
    const selected = this.selectedWish();
    return this.wishes().find(wish => wish.id === wishId) ?? (selected?.id === wishId ? selected : undefined);
  }

  private createBody (draft: WishDraft) : Schema<'WishCreate'> {
    return {
      title: draft.title,
      description: blankToNull(draft.description),
      price: toMoney(draft.price),
      links: toLinks(draft.url),
      // The server sets `url`; the generated type wants it too.
      image: draft.image?.key ? { key: draft.image.key } as Schema<'Image'> : null,
      color: blankToNull(draft.color),
      size: blankToNull(draft.size)
    };
  }

  /** What the copier filled in; the server copies the rest. The image is shared unless the copier chose another. */
  private copyBody (copy: WishDraft) : Schema<'WishCopyCreate'> {
    const { image, ...fields } = this.createBody(copy);
    const original = this.findKnownWish(copy.copyOf);
    const imageChanged = (copy.image?.key ?? null) !== (original?.image?.key ?? null);
    return imageChanged ? { ...fields, image } : fields;
  }

  private changesTo (original: Wish, draft: WishDraft) : Schema<'WishUpdate'> {
    const others = original.links.slice(1).map(link => link.url);
    const wanted = this.createBody(draft);
    // The form shows the first link only: the others stay as they are.
    wanted.links = toLinks(draft.url, others);

    const known = this.createBody(toDraft(original));
    known.links = toLinks(original.links[0]?.url, others);
    const changes: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(wanted)) {
      if (JSON.stringify(value) !== JSON.stringify(known[field as keyof typeof known])) changes[field] = value;
    }
    return changes;
  }

  /** Puts the new version of a wish in the list and on the wish page, wherever it is shown. */
  private replaceInView ( updated : Wish ) : void {
    this.list.value.set(this.wishes().map(wish => wish.id === updated.id ? updated : wish));
    if (this.readWish.hasValue() && this.readWish.value().id === updated.id) this.readWish.value.set(updated);
  }

  private addWishToWishlist ( newWish : Wish) : void {
    if (this.receiverId() === newWish.receiver.id) this.list.value.set([newWish, ...this.wishes()]);
  }

  private deleteWishFromWishlist (deletedWish : Wish) {
    this.list.value.set(this.wishes().filter(wish => wish.id !== deletedWish.id));
  }
}

const blankToNull = (text: string | null | undefined) => text?.trim() ? text.trim() : null;

/** Euros from the form to cents for the API; `null` when there is no price. */
const toMoney = (euros: number | null | undefined): Schema<'Money'> | null =>
  euros === null || euros === undefined || Number.isNaN(Number(euros)) || String(euros).trim() === ''
    ? null
    : { amount: Math.round(Number(euros) * 100), currency: 'EUR' };

/** The first link from the form (made absolute) followed by the links the form does not show. */
const toLinks = (first: string | null | undefined, others: string[] = []): Schema<'WishLink'>[] =>
  [...(first?.trim() ? [validateUrl(first)] : []), ...others].map(url => ({ url }));

/** The wish as the form shows it. */
export const toDraft = (wish: Wish): WishDraft => ({
  title: wish.title,
  price: wish.price ? wish.price.amount / 100 : null,
  url: wishUrl(wish) ?? '',
  color: wish.color ?? '',
  size: wish.size ?? '',
  description: wish.description ?? '',
  image: wish.image,
  copyOf: wish.copyOf
});
