import { ApplicationConfig, inject, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AuthStore } from './core/auth/auth-store';
import { problemInterceptor } from './core/api/problem-interceptor';
import { authErrorInterceptor } from './features/users/interceptors/auth-error-interceptor';
import { jwtInterceptor } from './features/users/interceptors/jwt-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideAnimations(),
    provideRouter(routes),
    provideHttpClient(withXhr(), withInterceptors([problemInterceptor, jwtInterceptor, authErrorInterceptor])),
    // Renews an older token in the background; the app does not wait for it.
    provideAppInitializer(() => { inject(AuthStore).renewIfNeeded().subscribe(); })
  ]
};
