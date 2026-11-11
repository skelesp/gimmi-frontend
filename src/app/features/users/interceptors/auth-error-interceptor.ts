import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { AuthStore } from '../../../core/auth/auth-store';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Notifications } from 'src/app/core/notifications';
import { environment } from 'src/environments/environment';

export const authErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  const notificationService = inject(Notifications);

    
    return next(request).pipe(
      catchError( err => {
        if ([401, 403].indexOf(err.status) !== -1){
          switch (err.status) {
            case 401: {
              // Failed login call: the login screen shows its own error. Don't navigate and don't
              // remember the login page as attemptedUrl, or the next successful login redirects
              // back to the login page.
              // Login and renewal: auth/token.
              if (request.url.startsWith(environment.apiV2Url + 'auth/token')) {
                return throwError(err);
              }

              notificationService.showNotification(
                "Voor het uitvoeren van deze actie moet u ingelogd zijn.",
                "error",
                "Login vereist"
                );

              // Handle current user
              let queryParams = {};
              
              if (auth.user()) {
                queryParams = { e: auth.user().email };
                auth.logout("401_RESPONSE");
              }
              
              // Navigate to login
              // Never return to a login/register page after authentication.
              if (!router.url.startsWith('/users/')) {
                auth.attemptedUrl = router.url;
              }
              router.navigate(['users/login'], {queryParams: queryParams});
              break;
            }
            case 403:
              // v2: the caller decides (e.g. reauthentication-required); only 401 is handled here.
              if (request.url.startsWith(environment.apiV2Url)) {
                break;
              }
              notificationService.showNotification(
                "Uw gebruiker is niet gemachtigd om deze pagina te bezoeken of deze actie uit te voeren.",
                "error"
              );
              break;
          }

          return throwError(err);
        }

        return throwError(err);
      })
    );
};
