import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { NotificationService } from 'src/app/shared/services/notification.service';
import { UserService } from '../service/user.service';
import { AuthErrorInterceptor } from './auth-error.interceptor';

// Reactie op 401 en 403 van de API. Het geval "401 terwijl iemand ingelogd is" roept logout()
// aan, en dat herlaadt de pagina; dat pad staat hier dus niet in.
describe('AuthErrorInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let router: jasmine.SpyObj<Router> & { url: string };
  let notifications: jasmine.SpyObj<NotificationService>;
  let users: { currentUser: any; attemptedUrl: string; logout: jasmine.Spy };

  function vraag(url: string, status: number): any {
    let fout: any;
    http.get(url).subscribe({ error: e => fout = e });
    backend.expectOne(url).flush({ message: 'x' }, { status, statusText: 'Fout' });
    return fout;
  }

  beforeEach(() => {
    router = Object.assign(jasmine.createSpyObj<Router>('Router', ['navigate']), { url: '/people/p9' });
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['showNotification']);
    users = { currentUser: null, attemptedUrl: null, logout: jasmine.createSpy('logout') };
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: AuthErrorInterceptor, multi: true },
        { provide: Router, useValue: router },
        { provide: NotificationService, useValue: notifications },
        { provide: UserService, useValue: users }
      ]
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('401: melding "Login vereist", naar login en de huidige pagina onthouden', () => {
    const fout = vraag('/api/wish/w1', 401);
    expect(fout.status).toBe(401);
    expect(notifications.showNotification).toHaveBeenCalledWith(jasmine.any(String), 'error', 'Login vereist');
    expect(users.attemptedUrl).toBe('/people/p9');
    expect(router.navigate).toHaveBeenCalledWith(['users/login'], { queryParams: {} });
    expect(users.logout).not.toHaveBeenCalled();
  });

  it('401 op de loginaanroep zelf: geen melding, geen navigatie, loginpagina niet onthouden', () => {
    // Anders stuurt de volgende geslaagde login je terug naar het loginscherm.
    router.url = '/users/login';
    const fout = vraag('/api/authenticate', 401);
    expect(fout.status).toBe(401);
    expect(notifications.showNotification).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(users.attemptedUrl).toBeNull();
  });

  it('401 vanop een /users/-pagina: die pagina niet als terugkeer-URL onthouden', () => {
    router.url = '/users/register';
    vraag('/api/people', 401);
    expect(users.attemptedUrl).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['users/login'], { queryParams: {} });
  });

  it('403: melding over ontbrekende rechten, geen navigatie', () => {
    const fout = vraag('/api/people/p2', 403);
    expect(fout.status).toBe(403);
    expect(notifications.showNotification).toHaveBeenCalledWith(jasmine.stringMatching('niet gemachtigd'), 'error');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('andere fouten: ongewijzigd doorgegeven, geen melding', () => {
    const fout = vraag('/api/wish/w1', 500);
    expect(fout.status).toBe(500);
    expect(notifications.showNotification).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
