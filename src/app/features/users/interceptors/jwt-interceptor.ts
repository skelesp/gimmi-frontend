import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthStore } from '../../../core/auth/auth-store';
import { environment } from 'src/environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthStore).token();

  // The token only goes to our own API, never to another address (such as the image domain).
  if (token && request.url.startsWith(environment.apiV2Url)) {
    request = request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(request);
};
