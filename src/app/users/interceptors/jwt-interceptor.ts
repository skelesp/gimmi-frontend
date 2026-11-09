import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { UserService } from '../service/user.service';
import { environment } from 'src/environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (request, next) => {
  const currentUser = inject(UserService).currentUser;
  const isLoggedIn = currentUser && currentUser.token;
  const isApiUrl = request.url.startsWith(environment.apiUrl);

  if (isLoggedIn && isApiUrl) {
    // v1 takes the bare token, v2 only accepts `Authorization: Bearer <jwt>`.
    const isV2 = request.url.startsWith(environment.apiV2Url);
    request = request.clone({
      setHeaders: { Authorization: isV2 ? `Bearer ${currentUser.token}` : `${currentUser.token}` }
    });
  }
  
  return next(request);
};
