import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { UserService } from '../service/user.service';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/shared/services/notification.service';

export const authErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const userService = inject(UserService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

    
    return next(request).pipe(
      catchError( err => {
        if ([401, 403].indexOf(err.status) !== -1){
          switch (err.status) {
            case 401: {
              // Failed login call: the login screen shows its own error. Don't navigate and don't
              // remember the login page as attemptedUrl, or the next successful login redirects
              // back to the login page.
              if (request.url.indexOf("api/authenticate") !== -1) {
                return throwError(err);
              }

              notificationService.showNotification(
                "Voor het uitvoeren van deze actie moet u ingelogd zijn.",
                "error",
                "Login vereist"
                );

              // Handle current user
              let queryParams = {};
              
              if (userService.currentUser) {
                queryParams = { e: userService.currentUser.email };
                userService.logout("401_RESPONSE");
              }
              
              // Navigate to login
              // Never return to a login/register page after authentication.
              if (!router.url.startsWith('/users/')) {
                userService.attemptedUrl = router.url;
              }
              router.navigate(['users/login'], {queryParams: queryParams});
              break;
            }
            case 403:
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
