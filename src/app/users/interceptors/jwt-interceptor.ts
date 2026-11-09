import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthStore } from '../../core/auth/auth-store';
import { environment } from 'src/environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthStore).token();
  const isApiUrl = request.url.startsWith(environment.apiUrl);

  if (token && isApiUrl) {
    // v1 takes the bare token, v2 only accepts `Authorization: Bearer <token>`.
    const isV2 = request.url.startsWith(environment.apiV2Url);
    request = request.clone({
      setHeaders: { Authorization: isV2 ? `Bearer ${token}` : token }
    });
  }

  return next(request);
};
