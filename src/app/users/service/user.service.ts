import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from "rxjs";
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthStore, CurrentUser } from '../../core/auth/auth-store';

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

/**
 * What is left of the user service while registering (sc-3285) and resetting a password (sc-3286) still
 * run on API v1. The login session itself lives in AuthStore.
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http$ = inject(HttpClient);
  private auth = inject(AuthStore);

  /**
   * @description Registers a new user via API v1 and logs in with the same credentials on API v2, because
   * v1 gives a token that v2 does not accept. Goes away with sc-3285.
   * @returns An observable with the logged in user.
   */
  public register(newUser : INewUserRequestInfo) : Observable<CurrentUser> {
    return this.http$.post(environment.apiUrl + 'people', newUser)
      .pipe(
        catchError(this.handleAErrorResponse),
        switchMap(() => this.auth.login(newUser.email, newUser.password))
      );
  }

  /**
   * @method @public
   * @description 
   */
  public requestPasswordReset(email: string): Observable<unknown> {
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
