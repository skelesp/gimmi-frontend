import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AuthErrorInterceptor } from './users/interceptors/auth-error.interceptor';
import { JwtInterceptor } from './users/interceptors/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
    provideAnimations(),
    provideRouter(routes),
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthErrorInterceptor, multi: true }
  ]
};
