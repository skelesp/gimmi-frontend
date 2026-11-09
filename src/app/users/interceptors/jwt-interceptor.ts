import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { UserService } from '../service/user.service';
import { environment } from 'src/environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (request, next) => {
  const currentUser = inject(UserService).currentUser;
  const isLoggedIn = currentUser && currentUser.token;
  const isApiUrl = request.url.startsWith(environment.apiUrl);

  if (isLoggedIn && isApiUrl) {
    request = request.clone({
      setHeaders: { Authorization: `${currentUser.token}` }
    });
  }
  
  return next(request);
};
