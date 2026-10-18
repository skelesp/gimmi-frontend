import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { UserService } from '../service/user.service';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/shared/services/notification.service';

@Injectable()
export class AuthErrorInterceptor implements HttpInterceptor {

  constructor( 
    private userService: UserService,
    private router: Router,
    private notificationService: NotificationService
    ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    return next.handle(request).pipe(
      catchError( err => {
        if ([401, 403].indexOf(err.status) !== -1){
          switch (err.status) {
            case 401:
              // Failed login call: the login screen shows its own error. Don't navigate and don't
              // remember the login page as attemptedUrl, or the next successful login redirects
              // back to the login page.
              if (request.url.indexOf("api/authenticate") !== -1) {
                return throwError(err);
              }

              this.notificationService.showNotification(
                "Voor het uitvoeren van deze actie moet u ingelogd zijn.",
                "error",
                "Login vereist"
                );

              // Handle current user
              let queryParams = {};
              
              if (this.userService.currentUser) {
                queryParams = { e: this.userService.currentUser.email };
                this.userService.logout("401_RESPONSE");
              }
              
              // Navigate to login
              // Never return to a login/register page after authentication.
              if (!this.router.url.startsWith('/users/')) {
                this.userService.attemptedUrl = this.router.url;
              }
              this.router.navigate(['users/login'], {queryParams: queryParams});
              break;
            case 403:
              this.notificationService.showNotification(
                "Uw gebruiker is niet gemachtigd om deze pagina te bezoeken of deze actie uit te voeren.",
                "error"
              );
              break;
          }

          const error = err.error.message || err.statusText;
          return throwError(err);
        }

        return throwError(err);
      })
    );
  }
}
