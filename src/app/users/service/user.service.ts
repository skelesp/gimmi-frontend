import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { JwtHelperService } from "@auth0/angular-jwt";
import { IDecodedUserToken, ILocalLoginInfo, User } from '../models/user.model';

export interface IAuthResponse {
  message: string;
  success: boolean;
  token: string;
}

export interface IPasswordResetRequest {
  email: string,
  resetPasswordRoute: string
}

export interface INewUserRequestInfo {
  firstname: string,
  lastname: string,
  email: string,
  birthday: string,
  password: string
}
export interface IValidatePasswordResetTokenResponse {
  firstName: string;
  token: string;
  expiresOn: Date;
}

type logoutReason = "USER_EVENT" | "EXPIRED_TOKEN" | "FAILED_AUTHENTICATION" | "401_RESPONSE";

// Don't inject via constructor: https://stackoverflow.com/questions/49739277/nullinjectorerror-no-provider-for-jwthelperservice
// See code example for standalone implementation: https://www.npmjs.com/package/@auth0/angular-jwt
const jwtService = new JwtHelperService();

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUserSubject: BehaviorSubject<User>;
  public currentUser$: Observable<User>;
  public attemptedUrl: string;

  constructor( 
    private http$: HttpClient,
    private router: Router,
    private notificationService: NotificationService
  ) { 
    this.currentUserSubject = new BehaviorSubject<User>(this.getUserFromStoredToken());
    this.currentUser$ = this.currentUserSubject.asObservable();

  }

  public get currentUser() : User {
    return this.currentUserSubject.value;
  }
  /**
   * @method @public
   * @description This method logs in a user via the Gimmi API. The API call returns a logged in user which is set as current user.
   * @param authInfo Object with interface = ILocalLoginInfo.
   * @returns An observable with the logged in user object.
   */
  public authenticate (authInfo: ILocalLoginInfo ) : Observable<User> {
    return this.http$.post<IAuthResponse>(environment.apiUrl + 'authenticate', {...authInfo, account: 'local'})
      .pipe(
        catchError(this.handleAErrorResponse),
        tap( authResponse => {
          this.persistentlySaveUserToken(authResponse.token);
          this.setUser(this.getUserFromStoredToken());
        }),
        map ( () => { return this.currentUser})
      );
    }
  /**
   * @method @public
   * @description This method registers a new user via the Gimmi API. The API call returns a logged in user which is set as current user.
   * @param newUser User object formatted as needed by the API call. Interface = INewUserRequestInfo
   * @returns An observable with the logged in user object.
   */
  public register(newUser : INewUserRequestInfo) : Observable<User> {
    return this.http$.post<IAuthResponse>(environment.apiUrl + 'people', newUser)
      .pipe(
        catchError(this.handleAErrorResponse),
        tap(authResponse => {
          this.persistentlySaveUserToken(authResponse.token);
          this.setUser(this.getUserFromStoredToken());
        }),
        map(() => { return this.currentUser })
      );
  }

  public logout(reason : logoutReason) : void {
    // Log logout info
    let logMessage = `[UserService] User logged out.`;
    if (reason) { logMessage += ` Reason : ${reason}` }
    console.info(logMessage);

    //Remove user
    localStorage.removeItem("currentUser");
    this.currentUserSubject?.next(null); // On init of this service, currentUserSubject isn't created when logout is called for expired token.

    this.notificationService.showNotification(
      "Je gebruiker is nu uitgelogd.",
      "info",
      'Uitgelogd'
    );
    location.reload();
  }

  /**
   * @method @private 
   * @description Method to redirect a user from a page after successful authentication.
   */
  public redirectAfterAuthentication () : void {
    if (this.currentUser) { // Should always be true because only called after authentication...
      const defaultRedirect = `/people/${this.currentUser.id}`;
      
      // Set redirect url
      const redirectUrl = this.attemptedUrl ? this.attemptedUrl : defaultRedirect;
      
      // Redirect user after authentication
      console.info(`[UserService] User is redirected to ${redirectUrl}`);
      this.router.navigateByUrl(redirectUrl);
      this.attemptedUrl = null;
    }
  }

  public showAuthenticationConfirmation () {
    // Notify user
    console.info(`[UserService] User ${this.currentUser.id} is authenticated.`);
    this.notificationService.showNotification(
      `Je bent nu ingelogd in Gimmi. <br> Veel plezier gewenst!`,
      "success",
      `Welkom ${this.currentUser.firstName}`
    );
  }

  /**
   * @method @public
   * @description 
   */
  public requestPasswordReset(email: string): Observable<any> {
    const body: IPasswordResetRequest = {
      email: email,
      resetPasswordRoute: environment.rootSiteUrl + "/users/resetpassword"
    }
    
    return this.http$.request('delete', environment.apiUrl + 'people/account/local', {
      headers: new HttpHeaders({ 'Content-Type': 'application/json;charset=utf-8'}),
      body: body
    }).pipe(catchError(this.handleAErrorResponse));
  }

  /**
   * @method @public
   * @description
   * @param password
   * @param token
   */
   public resetPassword (password : string, token: string) {
    if (password && token) {
      return this.http$.put<{email:string, usedToken:string}>(environment.apiUrl + 'people/account/local/' + token, {pw: password})
      .pipe(
        catchError(this.handleAErrorResponse)
      )
    }
   }

  /**
   * @method @public
   * @description
   * @param token Token received in validatae password request email
   */
  public validatePasswordResetToken( token: string) {
    if (token) {
      return this.http$.get<IValidatePasswordResetTokenResponse>(environment.apiUrl + 'people/account/local/' + token)
        .pipe(
          catchError(this.handleAErrorResponse)
        )
    }
  }

  /**
   * @method @public
   * @description Set the current user 
   * @param user User object
   */

  private setUser(user : User): void {
    this.currentUserSubject.next(user);
  }

  private persistentlySaveUserToken (token: string) : void {
    localStorage.setItem('currentUser', token);
  }

  private getUserFromStoredToken () : User {
    const token = localStorage.getItem('currentUser');
    if (!token) {
      console.info("[UserService] No token found in local storage");
      return null;
    }

    if (jwtService.isTokenExpired(token)) {
      this.handleExpiredToken();
      return null;
    }
    
    const decodedToken: IDecodedUserToken = jwtService.decodeToken(token);
    console.info("[UserService] User decoded from valid token");
    return new User(
      decodedToken.id,
      decodedToken.lastName,
      decodedToken.firstName,
      decodedToken.email,
      decodedToken.loginStrategy,
      token,
      decodedToken.accounts
    );
  }

  private handleExpiredToken () : void {
    // CurrentUserSubject doesn't exist when token is checked on page load ==> Check if CurrentUserSubject exists
    this.logout("EXPIRED_TOKEN");
    
    this.notificationService.showNotification(
      "Je sessie is verlopen. Gelieve opnieuw in te loggen.",
      "warning",
      "Uitgelogd");
    console.error("[UserService] Token is expired");
  }

  private handleAErrorResponse (errorResponse: HttpErrorResponse) {
    let errorMessage = 'Request ended with an error. Please try again.' + JSON.stringify(errorResponse);
    if (errorResponse.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = 'An error occurred:' + errorResponse.error.message;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      errorMessage = `Gimmi API returned code ${errorResponse.status} with message "${errorResponse.error.message || errorResponse.error.error}"`;
    }
    // Return an observable with a user-facing error message.
    return throwError(errorMessage);
  }
}
