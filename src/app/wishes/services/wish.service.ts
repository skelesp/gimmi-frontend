import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, expand, map, reduce, switchMap, tap } from 'rxjs/operators';

import { ApiClient } from 'src/app/core/api/api-client';
import { ApiProblem } from 'src/app/core/api/api-problem';
import { ProblemNotifier } from 'src/app/core/api/problem-notifier';
import { validateUrl } from 'src/app/_utility/url_utility';
import type { Schema } from 'src/app/core/api/api-types';
import { Person } from 'src/app/people/models/person.model';
import { Wish } from '../models/wish.model';
import { wishFromApi } from '../models/wish-from-api';

// A page holds at most 100 wishes; a list is read to the end (there is no "load more" yet).
const pageSize = 100;

/** Everything about wishes goes to API v2: reading, the wish itself, reserving and confirming a gift. */
@Injectable({
  providedIn: 'root'
})
export class WishService {
  private api = inject(ApiClient);
  private problems = inject(ProblemNotifier);

  private _wishes$: BehaviorSubject<Wish[]> = new BehaviorSubject<Wish[]>([]);
  public readonly wishes: Observable<Wish[]> = this._wishes$.asObservable();
  private _currentReceiver$ : BehaviorSubject<Person> = new BehaviorSubject<Person>(null);
  public readonly currentReceiver: Observable<Person> = this._currentReceiver$.asObservable();
  private _selectedWish$ : BehaviorSubject<Wish> = new BehaviorSubject<Wish>(null);
  public readonly selectedWish: Observable<Wish> = this._selectedWish$.asObservable();

  public getWishlist(receiver: Person): Observable<Wish[]> {
    this._currentReceiver$.next(receiver);
    const page = (cursor?: string) => this.api.get('/people/{personId}/wishes', {
      path: { personId: receiver.id },
      query: { limit: pageSize, cursor }
    });
    return page().pipe(
      expand(wishPage => wishPage.nextCursor ? page(wishPage.nextCursor) : EMPTY),
      reduce((items, wishPage) => [...items, ...wishPage.items], [] as Schema<'Wish'>[]),
      map(items => items.map(wishFromApi)),
      tap(wishes => this._wishes$.next(wishes))
    );
  }

  /** Reserves the wish for the viewer, or changes the viewer's own reservation. The giver comes from the token. */
  public addReservation(wish: Wish, reservation: { handoverDate: string; occasion: Schema<'Occasion'> }) : Observable<Wish> {
    return this.api.put('/wishes/{wishId}/reservation', { path: { wishId: wish.id }, body: reservation }).pipe(
      map(wishFromApi),
      tap(reserved => this.updateWishInWishlist(reserved)),
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
      map(wishFromApi),
      tap(fulfilled => this.updateWishInWishlist(fulfilled)),
      switchMap(fulfilled => this.addRelistedWish(fulfilled)),
      this.showProblem()
    );
  }

  /** Adds the wish that the server put back on the list to the list on screen; gives back the fulfilled wish. */
  private addRelistedWish (fulfilled: Wish) : Observable<Wish> {
    const relistedId = fulfilled.giftFeedback?.relistedWishId;
    if (!relistedId) return of(fulfilled);
    return this.fetchWish(relistedId).pipe(
      tap(relisted => this.addWishToWishlist(relisted)),
      map(() => fulfilled),
      catchError(() => of(fulfilled))
    );
  }

  /** Adds the wish to the list of `newWish.receiver`; with `copyOf` it is a copy of that wish on the list of the viewer. */
  public create ( newWish : Wish) : Observable<Wish>{
    const created = newWish.copyOf
      ? this.api.post('/wishes/{wishId}/copies', { path: { wishId: newWish.copyOf }, body: this.copyBody(newWish) })
      : this.api.post('/people/{personId}/wishes', { path: { personId: newWish.receiver.id }, body: this.createBody(newWish) });
    return created.pipe(
      map(wishFromApi),
      tap(wish => {
        this.addWishToWishlist(wish);
        if (newWish.copyOf) this.markCopied(newWish.copyOf, wish.id);
      }),
      this.showProblem()
    );
  }

  /** Sends only what differs from the wish as we know it (JSON Merge Patch). */
  public update ( wish : Wish ) : Observable<Wish>{
    const original = this.findKnownWish(wish.id);
    const changes = this.changesTo(wish, original);
    if (Object.keys(changes).length === 0) return of(original ?? wish);
    return this.api.patch('/wishes/{wishId}', { path: { wishId: wish.id }, body: changes }).pipe(
      map(wishFromApi),
      tap(updated => this.updateWishInWishlist(updated)),
      this.showProblem()
    );
  }

  public getWishById ( wishID: string ) : Observable<Wish> {
    // Check wish caches for wishID
    if (this._selectedWish$.value?.id === wishID) return of(this._selectedWish$.value);

    const index = this.findWishInWishlist(wishID);
    if (index !== -1) {
      const cachedWish: Wish = this._wishes$.value[index];
      this.updateSelectedWish(cachedWish);
      return of(cachedWish);
    }

    return wishID ?
      this.fetchWish(wishID).pipe(tap(wish => this.updateSelectedWish(wish)))
      : of(null);
  }

  /* PRIVATE methods */
  private fetchWish (wishId: string) : Observable<Wish> {
    return this.api.get('/wishes/{wishId}', { path: { wishId } }).pipe(map(wishFromApi));
  }

  /** Reads the wish again after a write, and puts the fresh version in the list. */
  private reloadWish (wish: Wish) : Observable<Wish> {
    return this.fetchWish(wish.id).pipe(tap(updated => this.updateWishInWishlist(updated)));
  }

  /** The viewer now has a copy of this wish on their list: the "already on your list" warning follows. */
  private markCopied (originalId: string, copyId: string) : void {
    for (const wish of [...this._wishes$.value, this._selectedWish$.value]) {
      if (wish?.id === originalId && wish.viewer) wish.viewer = { ...wish.viewer, ownCopyId: copyId };
    }
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
    return this._wishes$.value.find(wish => wish.id === wishId)
      ?? (this._selectedWish$.value?.id === wishId ? this._selectedWish$.value : undefined);
  }

  private createBody (wish: Wish) : Schema<'WishCreate'> {
    return {
      title: wish.title,
      description: blankToNull(wish.description),
      price: toMoney(wish.price),
      links: toLinks(wish.url),
      // The server sets `url`; the generated type wants it too.
      image: wish.image?.key ? { key: wish.image.key } as Schema<'Image'> : null,
      color: blankToNull(wish.color),
      size: blankToNull(wish.size)
    };
  }

  /** What the copier filled in; the server copies the rest. The image is shared unless the copier chose another. */
  private copyBody (copy: Wish) : Schema<'WishCopyCreate'> {
    const { image, ...fields } = this.createBody(copy);
    const original = this.findKnownWish(copy.copyOf);
    const imageChanged = (copy.image?.key ?? null) !== (original?.image?.key ?? null);
    return imageChanged ? { ...fields, image } : fields;
  }

  private changesTo (wish: Wish, original: Wish | undefined) : Schema<'WishUpdate'> {
    const wanted = this.createBody(wish);
    // The form shows the first link only: the others stay as they are.
    wanted.links = toLinks(wish.url, original?.links.slice(1));
    if (!original) return wanted;

    const known = this.createBody(original);
    known.links = toLinks(original.links[0], original.links.slice(1));
    const changes: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(wanted)) {
      if (JSON.stringify(value) !== JSON.stringify(known[field as keyof typeof known])) changes[field] = value;
    }
    return changes;
  }

  private updateSelectedWish ( wish: Wish ) : void {
    this._selectedWish$.next(wish);
  }

  private findWishInWishlist (wishID : string) : number {
    return this._wishes$.value.findIndex(item => item.id === wishID);
  }

  private updateWishInWishlist(updatedWish: Wish): void {
    const currentWishlist = [...this._wishes$.value]; //spread operator passes a copy of the array, so change detection will detect this change.
    if (currentWishlist.length !== 0) {
      const index = this.findWishInWishlist(updatedWish.id);
      if (index !== -1) currentWishlist[index] = updatedWish;
    }
    this._wishes$.next(currentWishlist);

    if (this._selectedWish$.value) this.updateSelectedWish(updatedWish);
  }

  private addWishToWishlist ( newWish : Wish) : void {
    if (this._currentReceiver$.value?.id === newWish.receiver.id) {
      const wishlist = [...this._wishes$.value]; // nieuwe verwijzing: een signal (toSignal) negeert dezelfde array
      wishlist.unshift(newWish);
      this._wishes$.next(wishlist);
    }
  }

  private deleteWishFromWishlist (deletedWish : Wish) {
    const filteredWishlist = this._wishes$.value.filter( wish => {
      return wish.id !== deletedWish.id;
    }); // Filter always returns copy of array

    this._wishes$.next(filteredWishlist);
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
