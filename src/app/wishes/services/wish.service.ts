import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, of, BehaviorSubject } from 'rxjs';
import { expand, map, reduce, switchMap, tap } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { ApiClient } from 'src/app/core/api/api-client';
import type { Schema } from 'src/app/core/api/api-types';
import { Person } from 'src/app/people/models/person.model';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { IGiftFeedback, IReservation, IWishImage, Wish } from '../models/wish.model';
import { wishFromApi } from '../models/wish-from-api';

/**
 * Afbeeldingsveld zoals de API het geeft en verwacht: R2 {key, url} (sc-3052). De API
 * bewaart alleen `key` en geeft `url` erbij.
 */
interface IWishImageApi {
  key?: string;
  url?: string;
}

interface IReservationRequest {
  reservedBy: string;
  amount: number;
  reason: string;
  reservationDate: Date;
  handoverDate?: Date;
}

interface IClosureRequest {
  closedBy: string;
  reason: string;
  closedOn: Date;
}

interface IWishRequest {
  id: string;
  title: string;
  price: number;
  image?: IWishImageApi;
  reservation: IReservation;
  giftFeedback: IGiftFeedback;
  copyOf: string;
  url: string;
  receiver: Person;
  createdBy: Person;
  color: string;
  size: string;
  description: string;
  amountWanted: number;
  _id: string;
}

interface IWishCreateRequest {
  title: string;
  price: number;
  url: string;
  color: string;
  size: string;
  description: string;
  receiver: string;
  createdBy: string;
  amountWanted: number;
  image?: IWishImageApi;
  copyOf?: string;
}

// A page holds at most 100 wishes; a list is read to the end (there is no "load more" yet).
const pageSize = 100;

/**
 * Reads go to API v2 (a list per request, status and rights from the server). Writes still go to API v1 and
 * are followed by a read of the wish, until sc-3289 and sc-3291 move them too.
 */
@Injectable({
  providedIn: 'root'
})
export class WishService {
  private http$ = inject(HttpClient);
  private api = inject(ApiClient);
  private auth = inject(AuthStore);

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

  public addReservation(wish: Wish, reservation: IReservation) : Observable<Wish>{
    const reservationRequestData: IReservationRequest = { ...reservation, reservedBy: reservation.reservedBy.id };

    return this.http$.post(
      environment.apiUrl + 'wish/' + wish.id + '/reservation',
      reservationRequestData
    ).pipe(
      switchMap(() => this.reloadWish(wish))
    )
  }

  public deleteReservation(wish: Wish) : Observable<Wish>{
    return this.http$.delete(
      environment.apiUrl + 'wish/' + wish.id + '/reservation'
    ).pipe(
      switchMap(() => this.reloadWish(wish))
    );
  }

  public delete (wish: Wish) : Observable<Wish>{
    return this.http$.delete(
      environment.apiUrl + 'wish/' + wish.id
    ).pipe(
      // De afbeelding ruimt de backend zelf op (sc-3052).
      map(() => wish),
      tap(wish => this.deleteWishFromWishlist(wish) )
    );
  }

  public addGiftFeedback (wish: Wish, giftFeedback: IGiftFeedback) : Observable<Wish> {
    return this.http$.post(
      environment.apiUrl + 'wish/' + wish.id + "/feedback",
      giftFeedback
    ).pipe(
      switchMap(() => this.reloadWish(wish))
    )
  }

  public create ( newWish : Wish) : Observable<Wish>{
    const wishCreatePayload : IWishCreateRequest = {
      title: newWish.title,
      price: newWish.price,
      url: newWish.url,
      color: newWish.color,
      size: newWish.size,
      description: newWish.description,
      receiver: newWish.receiver.id,
      createdBy: newWish.createdBy.id,
      amountWanted: newWish.amountWanted,
    }

    const image = imageVoorApi(newWish.image);
    if (image) wishCreatePayload.image = image;

    if (newWish.copyOf) wishCreatePayload.copyOf = newWish.copyOf;

    return this.http$.post<{ _id: string }>(
      environment.apiUrl + "wish",
      wishCreatePayload
    ).pipe(
      switchMap(created => this.fetchWish(created._id)),
      tap(wish => {
        this.addWishToWishlist(wish);
        if (newWish.copyOf) this.markCopied(newWish.copyOf, wish.id);
      })
    )
  }

  public update ( wish : Wish ) : Observable<Wish>{
    const wishRequest = {
      ...wish,
      _id: wish.id,
      receiver: wish.receiver,
      // De API bewaart van het afbeeldingsveld alleen de sleutel.
      image: imageVoorApi(wish.image)
    } as IWishRequest;
    return this.http$.put(
      environment.apiUrl + 'wish/' + wish.id,
      wishRequest
    ).pipe(
      switchMap(() => this.reloadWish(wish))
    );
  }

  public close (wish: Wish) : Observable<Wish>{
    const closure: IClosureRequest = {
      closedBy: this.auth.user().id,
      closedOn: new Date(),
      reason: "Cadeau ontvangen"
    }
    return this.http$.post(
      environment.apiUrl + 'wish/' + wish.id + "/closure",
      closure
    ).pipe(
      switchMap(() => this.reloadWish(wish))
    )
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
/** Afbeelding van de app naar de vorm van de API; undefined als er geen is. */
export function imageVoorApi(image: IWishImage): IWishImageApi {
  if (image?.key) return { key: image.key };
  return undefined;
}
