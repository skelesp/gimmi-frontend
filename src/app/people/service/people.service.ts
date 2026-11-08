import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { Person, ILike, IExtraPersonInfo } from '../models/person.model';
import { CommunicationService, MailInfo } from 'src/app/shared/services/communication.service';
import { UserService } from 'src/app/users/service/user.service';

export interface InvitePersonData {
  email: string;
  notifyOnRegistration: boolean | null;
}

export interface IPersonNameResponse {
  _id : string;
  firstName : string;
  lastName : string;
  fullName : string;
  id : string;
}

export interface IPersonEmailResponse extends IPersonNameResponse{
  email: string;
}

export interface IPersonSearchResponse {
  _id: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
  updatedAt: Date;
  extraInfo?: IExtraPersonInfo;
  birthday?: Date;
}
export interface IPersonSearchResponseWithUserInfo extends IPersonSearchResponse {
  accounts?: any;
}

@Injectable({
  providedIn: 'root'
})
export class PeopleService {
  private _people$ : BehaviorSubject<Person[]> = new BehaviorSubject<Person[]>([]);
  public readonly people: Observable<Person[]> = this._people$.asObservable();

  constructor( 
    private http$: HttpClient,
    private communicationService: CommunicationService,
    private userService: UserService
  ) { }

  /**
   * @method @public
   * @description Request the full list of people from the server. No filter applied! Puts result in private people observable.
   */
  public retrievePeopleList () : void {
    this.http$.get<IPersonNameResponse[]>(environment.apiUrl + 'people')
    .pipe(
      map( peopleFromResponse => {
        const people: Person[] = [];
        peopleFromResponse.forEach(person => {
          people.push(this.convertPersonResponseToPerson(person));
        });
        return people;
      }),
      catchError(this.handleError)
    )
    .subscribe( people => {
      this._people$.next(people);
    });
  }

  /**
   * @method @public
   * @description Get a person by his ID from the Gimmi API.
   * @param personId ID of a person
   * @returns person object
   */

   public getPersonById( personId : string) : Observable<Person> {
    return this.http$.get<IPersonSearchResponseWithUserInfo>( environment.apiUrl + 'people/' + personId )
    .pipe(
      catchError(this.handleError),
      map(personResult => this.convertPersonResponseToPerson(personResult))
      )
   }

  /**
   * @description Add a person to the people list without call the backend.
   * @param person 
   */
  public addPerson ( person: Person ) {
    this._people$.next(
      [...this._people$.value, person]
      );
  }

  /**
   * @method @public
   * @description Find a person based on an email address.
   * @param email Search parameter 'email' to search for a person.
   */
  public findPersonByEmail (email: string): Observable<Person> {
    if (email) {
      return this.http$.get<IPersonEmailResponse>(environment.apiUrl + `people/email/${email}`)
        .pipe(
          map( personResult => this.convertPersonResponseToPerson(personResult) ),
          catchError(this.handleError)
        )
    } else return throwError(new Error("No email provided to method findPersonByEmail"));
  }

  /**
   * @method @public
   * @description Invite someone to register in Gimmi and create a wishlist.
   * @param mailInfo The info necessary to send an email (to, cc, subject, body, ...)
   */
  public invite (inviteInfo: InvitePersonData) {
    const mailInfo: MailInfo = {
      to: inviteInfo.email,
      subject: "[DEV@GIMMI] Iemand vraagt je om een wensenlijst aan te maken op Gimmi",
      html: `Beste,<br/>
      <br/>
      Mensen zijn op zoek naar een cadeau voor jou en vragen je om een wensenlijst op te maken, zodat ze het perfecte cadeau kunnen komen.<br/>
      <br/>
      Ga snel naar <a href="${environment.rootSiteUrl}/users/register?e=${inviteInfo.email}">de registratiepagina van gimmi.be</a> om je te registreren en je wensenlijst op te maken! Zo krijg je vanaf nu enkel nog cadeaus die je écht wilt hebben!<br/>
      <br/>      
      Hopelijk tot snel, <br/>
      <strong>Gimmi.be</strong>`
    };

    this.communicationService.sendMail(mailInfo);
  }
  
  /**
   * @description Get name info for a person
   * @param personId A valid personId 
   * @returns Person object
   */
  public getNameById (personId : string) : Observable<Person> {
    return personId ? this.http$.get<IPersonNameResponse>( environment.apiUrl + 'people/' + personId + '/name').pipe(
      catchError(this.handleError),
      map(personResponse => this.convertPersonResponseToPerson(personResponse))
    ) : throwError('No personId provided');
  }

  /**
   * @description Get email info for a person
   * @param personId A valid personId
   * @returns Person object
   */
  public getEmailById (personId : string) : Observable<string> {
    return personId ? this.http$.get<string>(
      environment.apiUrl + 'people/' + personId + '/email'
    ).pipe(
      catchError(this.handleError)      
    ) : throwError('No personId provided');
  }

  /**
   * 
   * @param @description Update the extra info (=likes and dislikes) of a person
   * @param personId The id of the person which needs to be updated
   * @param likes The updated likes of the person.
   * @param dislikes The updated dislikes of the person.
   */
  public updateExtraInfo ( personId: string, likes: ILike[], dislikes: ILike[]) : Observable<Person> {
    return this.http$.put<IPersonSearchResponseWithUserInfo>(environment.apiUrl + 'people/' + personId + '/extraInfo', {likes, dislikes})
    .pipe(
      map( personResponse => this.convertPersonResponseToPerson(personResponse))
    );
  }
  
  /**
   * @method @public
   * @description Compare the current user with the person provided
   * @param person
   * @returns boolean (true = person is equal to current user)
   */
  public isEqualToCurrentUser( person: Person) : boolean {
    return person ? person.id === this.userService.currentUser?.id : undefined;
  }

  /**  
  * @method @private
  * @description Converts the person object received from the server to the person class instance used in the app. 
  * @param personResponse The person object received from the server
  * @returns A Person class instance that is usable in the app
  */
  private convertPersonResponseToPerson(personResponse: IPersonSearchResponse | IPersonSearchResponseWithUserInfo | IPersonNameResponse | IPersonEmailResponse): Person {
    const person = new Person( personResponse.id, personResponse.firstName, personResponse.lastName );
    if (this.isInstanceOfIPersonSearchResponse(personResponse)) {
      if (personResponse.birthday) person.birthday = personResponse.birthday;
      if (personResponse.extraInfo) person.extraInfo = personResponse.extraInfo; 
    }
    
    return person;
  } 

  /**
   * @method @private
   * @description Detect if an object implements the IPersonSearchResponse
   */
  private isInstanceOfIPersonSearchResponse(object: any): object is IPersonSearchResponse {
    return 'extraInfo' in object || 'birthday' in object;
  }


  /** 
   * @method @private 
   * @description Handle errors in the people service HTTP calls
  */
 private handleError (error : HttpErrorResponse) {
   let errorMessage = 'Request ended with an error. Please try again.' + JSON.stringify(error);
  if (error.error instanceof ErrorEvent) {
     // A client-side or network error occurred. Handle it accordingly.
     errorMessage = 'An error occurred:' + error.error.message;
   } else {
     // The backend returned an unsuccessful response code.
     // The response body may contain clues as to what went wrong.
     errorMessage = `Gimmi API returned code ${error.status}. Error info: ${JSON.stringify(error.error)}`;
   }
   // Return an observable with a user-facing error message.
   console.error(errorMessage);
   return throwError( errorMessage );
 }

}
