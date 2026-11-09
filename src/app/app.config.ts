import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authErrorInterceptor } from './users/interceptors/auth-error.interceptor';
import { jwtInterceptor } from './users/interceptors/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
    provideAnimations(),
    provideRouter(routes),
    provideHttpClient(withXhr(), withInterceptors([jwtInterceptor, authErrorInterceptor]))
  ]
};
