import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, of, BehaviorSubject } from 'rxjs';
import { catchError, defaultIfEmpty, map, switchMap, tap } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { Person } from 'src/app/people/models/person.model';
import { IPersonNameResponse, IPersonSearchResponse, PeopleService } from 'src/app/people/service/people.service';
import { UserService } from 'src/app/users/service/user.service';
import { IClosure, IGiftFeedback, IReservation, IWishImage, Wish } from '../models/wish.model';

/**
 * Afbeeldingsveld zoals de API het geeft en verwacht: R2 {key, url} (sc-3052). De API
 * bewaart alleen `key` en geeft `url` erbij.
 */
interface IWishImageApi {
  key?: string;
  url?: string;
}

interface IWishlistResponse {
  _id: {
    receiver: IPersonSearchResponse
  };
  wishes: IWishResponse[];
  count: number;
}

interface IWishResponse {
  _id: string;
  receiver: string;
  title: string;
  image?: IWishImageApi;
  price?: number;
  url?: string;
  createdBy: {
    _id: string;
    firstName:string;
    lastName: string;
  };
  color?: string;
  size?: string;
  description?: string;
  amountWanted: number;
  reservation?: IReservationResponse,
  giftFeedback?: {
    _id: string;
    satisfaction: string;
    receivedOn: Date;
    message: string;
    putBackOnList: boolean;
  },
  closure?: IClosureResponse;
  createdAt: Date;
  updatedAt: Date;
}

interface IWishResponseWithFullCreatedBy {
  receiver: string;
  _id: string;
  title: string;
  image?: IWishImageApi;
  price?: number;
  url?: string;
  createdBy: IPersonNameResponse;
  color?: string;
  size?: string;
  description?: string;
  amountWanted: number;
  reservation?: any;
  giftFeedback?: any;
  closure?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface IReservationResponseWithFullReservedBy {
  reservedBy: IPersonNameResponse,
  amount: number;
  reason: string;
  reservationDate: Date;
  handoverDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  _id: string;
  id: string;
}
interface IWishReservationResponse extends IWishResponseWithFullCreatedBy {
  reservation: IReservationResponseWithFullReservedBy;
}

interface IWishFeedbackResponse extends IWishReservationResponse {
  giftFeedback: IGiftFeedbackResponse
}

interface IWishClosureResponse extends IWishFeedbackResponse {
  closure: IClosureResponse
}

interface IReservationResponse {
  reservedBy: string;
  amount: number;
  reason: string;
  reservationDate: Date;
  handoverDate?: Date;
}

interface IGiftFeedbackResponse {
  message: string,
  putBackOnList: boolean,
  receivedOn: Date,
  satisfaction: string
}

interface IClosureResponse {
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
  closure: IClosure;
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

type wishStatusInResponse = 'Open' | 'Reserved' | 'Received' | 'Closed';

@Injectable({
  providedIn: 'root'
})
export class WishService {
  private _wishes$: BehaviorSubject<Wish[]> = new BehaviorSubject<Wish[]>([]);
  public readonly wishes: Observable<Wish[]> = this._wishes$.asObservable();
  private _currentReceiver$ : BehaviorSubject<Person> = new BehaviorSubject<Person>(null);
  public readonly currentReceiver: Observable<Person> = this._currentReceiver$.asObservable();
  private _selectedWish$ : BehaviorSubject<Wish> = new BehaviorSubject<Wish>(null);
  public readonly selectedWish: Observable<Wish> = this._selectedWish$.asObservable();

  constructor(
    private http$ : HttpClient,
    private userService : UserService,
    private peopleService : PeopleService
  ) { }

  public getWishlist(receiver: Person): Observable<Wish[]> { //https://stackoverflow.com/questions/65417031/rxjs-how-to-make-foreach-loop-wait-for-inner-observable
    return this.http$.get<IWishlistResponse[]>(
      environment.apiUrl + 'wishlist/' + receiver.id
    ).pipe(
      tap(wishlistResponse => {
        let receiver : Person = new Person(
          wishlistResponse[0]._id.receiver._id,
          wishlistResponse[0]._id.receiver.firstName,
          wishlistResponse[0]._id.receiver.lastName
        );
        this._currentReceiver$.next(receiver);
      }),
      // Create wish instances from each wish in API response and save reservation / closure for later use and retrieve reservedBy Person object
      switchMap(wishlistResponse => forkJoin(
        wishlistResponse[0].wishes.map(wishResponse => this.convertWishResponseToFullWishInstance(wishResponse, receiver))
        )
      ),
      // Default case if wishlist is empty
      defaultIfEmpty(<Wish[]>[]),
      tap(wishes => this._wishes$.next(wishes))
    );
  }

  public addReservation(wish: Wish, reservation: IReservation) : Observable<Wish>{
    let reservationRequestData: IReservationResponse = { ...reservation, reservedBy: reservation.reservedBy.id };

    return this.http$.post<IWishReservationResponse>(
      environment.apiUrl + 'wish/' + wish.id + '/reservation', 
      reservationRequestData
    ).pipe(
      switchMap(wishReservationResponse => this.convertWishReservationResponseToUpdatedWish(wishReservationResponse, wish))
    )
  }

  public deleteReservation(wish: Wish) : Observable<Wish>{
    return this.http$.delete<IWishReservationResponse>(
      environment.apiUrl + 'wish/' + wish.id + '/reservation'
    ).pipe(
      switchMap(reservationDeleteResponse => this.convertWishReservationResponseToUpdatedWish(reservationDeleteResponse, wish))
    );
  }

  public delete (wish: Wish) : Observable<Wish>{
    return this.http$.delete<IWishResponse>(
      environment.apiUrl + 'wish/' + wish.id
    ).pipe(
      map(wishResponse => this.createBasicWishInstanceFromResponse(wishResponse, wish.receiver)),
      // De afbeelding ruimt de backend zelf op (sc-3052).
      tap(wish => this.deleteWishFromWishlist(wish) )
    );
  }

  public addGiftFeedback (wish: Wish, giftFeedback: IGiftFeedback) : Observable<Wish> {
    return this.http$.post<IWishFeedbackResponse>(
      environment.apiUrl + 'wish/' + wish.id + "/feedback", 
      giftFeedback
    ).pipe(
      switchMap(addFeedbackResponse => this.convertWishReservationResponseToUpdatedWish(addFeedbackResponse, wish))
    )
  }
  
  public create ( newWish : Wish) : Observable<Wish>{
    let wishCreatePayload : IWishCreateRequest = {
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

    return this.http$.post<IWishResponse>(
      environment.apiUrl + "wish",
      wishCreatePayload 
    ).pipe(
      switchMap(wishResponse => this.convertWishResponseToFullWishInstance(wishResponse, newWish.receiver)),
      tap(wish => this.addWishToWishlist(wish))
    )
  }

  public update ( wish : Wish ) : Observable<Wish>{
    const wishRequest = <IWishRequest>{
      ...wish,
      _id: wish.id,
      receiver: wish.receiver,
      // De API bewaart van het afbeeldingsveld alleen de sleutel.
      image: imageVoorApi(wish.image)
    };
    return this.http$.put<IWishReservationResponse>(
      environment.apiUrl + 'wish/' + wish.id,
      wishRequest
    ).pipe(
      switchMap(updatedWish => this.convertWishReservationResponseToUpdatedWish(updatedWish, wish))
    );
  }

  public close (wish: Wish) : Observable<Wish>{
    let closure: IClosureResponse = {
      closedBy: this.userService.currentUser.id,
      closedOn: new Date(),
      reason: "Cadeau ontvangen"
    }
    return this.http$.post<IWishClosureResponse>(
      environment.apiUrl + 'wish/' + wish.id + "/closure",
      closure
    ).pipe(
      switchMap(wishClosureResponse => this.convertWishReservationResponseToUpdatedWish(wishClosureResponse, wish))
    )
  }

  public getCopiesOnListOf(receiver: Person) : Observable<Wish[]> {
    return receiver ? 
      this.http$.get<Wish[]>(
        environment.apiUrl + 'wishlist/' + receiver.id + '/copies'
      ).pipe(
        tap(wishes => console.log(wishes))
      )
    : of([]);
  } 

  public getWishById ( wishID: string ) : Observable<Wish> {
    // Check wish caches for wishID
    if (this._selectedWish$.value?.id === wishID) return of(this._selectedWish$.value);
    
    let index = this.findWishInWishlist(wishID);
    if (index !== -1) {
      let cachedWish: Wish = this._wishes$.value[index];
      this.updateSelectedWish(cachedWish);
      return of(cachedWish);
    }
    
    return wishID ? 
      this.http$.get<IWishResponseWithFullCreatedBy[]>(environment.apiUrl + 'wish/' + wishID)
          .pipe( 
            map(wishResponse => wishResponse[0]),
            switchMap(wishResponse => this.peopleService.getPersonById(wishResponse.receiver).pipe(
              switchMap(personResponse => this.convertWishResponseToFullWishInstance(wishResponse, personResponse) )
              )),
              tap(wish => this.updateSelectedWish(wish))
          )          
      : of(null);
  }

  /* PRIVATE methods */
  private updateSelectedWish ( wish: Wish ) : void {
    this._selectedWish$.next(wish);
  }

  private findWishInWishlist (wishID : string) : number {
    return this._wishes$.value.findIndex(item => item.id === wishID);
  }

  private updateWishInWishlist(updatedWish: Wish): void {
    let currentWishlist = [...this._wishes$.value]; //spread operator passes a copy of the array, so change detection will detect this change.
    if (currentWishlist.length !== 0) {
      let index = this.findWishInWishlist(updatedWish.id);
      currentWishlist[index] = updatedWish;
    }
    this._wishes$.next(currentWishlist);
    
    if (this._selectedWish$.value) this.updateSelectedWish(updatedWish);
  }

  private addWishToWishlist ( newWish : Wish) : void {
    if (this._currentReceiver$.value.id === newWish.receiver.id) {
      let wishlist = this._wishes$.value;
      wishlist.unshift(newWish);
      this._wishes$.next(wishlist);
    }
  }

  private deleteWishFromWishlist (deletedWish : Wish) {
    let filteredWishlist = this._wishes$.value.filter( wish => {
      return wish.id !== deletedWish.id;
    }); // Filter always returns copy of array
    
    this._wishes$.next(filteredWishlist);
  }

  private convertWishReservationResponseToUpdatedWish (wishReservationResponse: IWishReservationResponse | IWishResponseWithFullCreatedBy, wish: Wish) : Observable<Wish>{
    return of(wishReservationResponse).pipe(
      // !! Dit is een nutteloze actie puur om ervoor te zorgen dat de wishResponse van deze call gelijk is aan deze van de getWishlist
      map(wishResponse => {
        let newWishResponse: any = { ...wishResponse };
        if (newWishResponse.reservation)
          newWishResponse.reservation.reservedBy = newWishResponse.reservation.reservedBy.id;
        return newWishResponse;
      }),
      switchMap(wishResponse => this.convertWishResponseToFullWishInstance(wishResponse, wish.receiver)
      ),
      tap(wish => this.updateWishInWishlist(wish))
    )
  }

  private convertWishResponseToFullWishInstance(wishResponse : IWishResponse | IWishResponseWithFullCreatedBy, receiver : Person) : Observable<Wish>{
    // Create wish without reservation and closure
    let wish = this.createBasicWishInstanceFromResponse(wishResponse, receiver);
    // Fetch Person corresponding to closedBy and reservedBy objectID's
    // !! This can be avoided if the API returns fully populated wish object...
    return forkJoin([
      of(wish),
      this.getFullReservationInfo(wishResponse.reservation),
      this.getFullClosureInfo(wishResponse.closure)
    ])
    .pipe(
      // Add full closure and reservation info into wish
      map(([wish, reservationWithReservedByPerson, closureWithClosedByPerson]) => {
        if(reservationWithReservedByPerson) wish.reservation = reservationWithReservedByPerson;
        if(closureWithClosedByPerson) wish.closure = closureWithClosedByPerson;
        return wish;
      }),
      // Get state via API call
      // !! Dit wordt overbodig als de API de state al in de cal meegeeft
      switchMap( wish => this.addStateToWish(wish)),
      // Call method to set user flags in each instance (must be done after reservedBy is added and status is retrieved)
      map ( wish => {
        wish.setUserIsFlags(this.userService.currentUser)
        return wish;
      })
    );
  }

  private isInstanceOfIReservationResponseWithFullReservedBy(reservation: IReservationResponse | IReservationResponseWithFullReservedBy): reservation is IReservationResponseWithFullReservedBy {
    if (typeof reservation.reservedBy === 'string') return false;
    return 'firstName' in reservation.reservedBy && 'lastName' in reservation.reservedBy;
  }

  private getFullReservationInfo ( reservation: IReservationResponse | IReservationResponseWithFullReservedBy) :  Observable<IReservation>{
    let completeReservation : IReservation;
    if (!reservation || !reservation.reservedBy) {return of(null) ;}
    else if (this.isInstanceOfIReservationResponseWithFullReservedBy(reservation)) {
      return of({
      ...reservation, reservedBy: new Person(
        reservation.reservedBy.id, 
        reservation.reservedBy.firstName, 
        reservation.reservedBy.lastName)
      })
    } else {
      return this.peopleService.getPersonById(reservation.reservedBy)
        .pipe(
          map(reservedBy => {
            if (reservedBy) completeReservation = {
              ...reservation,
              reservedBy: new Person(reservedBy.id, reservedBy.firstName, reservedBy.lastName)
            }
            return completeReservation;
          }),
          catchError((error: HttpErrorResponse) => {
            console.error(`[wishService] ReservedBy ID not found`);
            return of({ ...reservation, reservedBy: new Person(reservation.reservedBy, 'not', 'found') });
          })
        )
    }
  }

  private getFullClosureInfo (closure: IClosureResponse): Observable<IClosure> {
    let completeClosure : IClosure;
    return (!closure || !closure.closedBy) ? of(null) :
      this.peopleService.getPersonById(closure.closedBy)
        .pipe(
          map(closedBy => {
            if (closedBy) completeClosure = {
              ...closure,
              closedBy: new Person(closedBy.id, closedBy.firstName, closedBy.lastName)
            }
            return completeClosure;
          }),
          catchError((error: HttpErrorResponse) => {
            console.error(`[wishService] ClosedBy ID not found`);
            return of({ ...closure, closedBy: new Person(closure.closedBy, 'not', 'found') });
          })
        )
  }

  private addStateToWish (wishWithoutState : Wish) : Observable<Wish> {
    return this.http$.get<wishStatusInResponse>(environment.apiUrl + 'wish/' + wishWithoutState.id + '/state')
      .pipe(
        map(state => {
          if (state === "Closed") wishWithoutState.status = "Fulfilled";
          else wishWithoutState.status = state;

          return wishWithoutState;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error(`[wishService] ${error}`);
          wishWithoutState.status = 'Open';
          return of(wishWithoutState);
        })
      )
  }
  
  private createBasicWishInstanceFromResponse ( wishResponse : IWishResponse, receiver: Person ) : Wish {
    let wish : Wish = new Wish (
      wishResponse._id,
      wishResponse.title,
      wishResponse.price,
      wishResponse.url,
      receiver,
      new Person(wishResponse.createdBy._id, wishResponse.createdBy.firstName, wishResponse.createdBy.lastName),
      wishResponse.color,
      wishResponse.size,
      wishResponse.description,
      wishResponse.amountWanted
    );
    wish.createdAt = wishResponse.createdAt;

    wish.image = imageUitApi(wishResponse.image);

    if (wishResponse.giftFeedback) wish.giftFeedback = {
      satisfaction: wishResponse.giftFeedback.satisfaction,
      receivedOn: wishResponse.giftFeedback.receivedOn,
      message: wishResponse.giftFeedback.message,
      putBackOnList: wishResponse.giftFeedback.putBackOnList
    };
    
    return wish;
  }
}
/** Afbeelding van de app naar de vorm van de API; undefined als er geen is. */
export function imageVoorApi(image: IWishImage): IWishImageApi {
  if (image?.key) return { key: image.key };
  return undefined;
}

/** Afbeelding uit de API naar de vorm van de app; undefined als er geen is. */
export function imageUitApi(image: IWishImageApi): IWishImage {
  if (image?.key && image?.url) return { key: image.key, url: image.url };
  return undefined;
}
