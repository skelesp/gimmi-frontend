import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { environment } from 'src/environments/environment';
import { Notifications } from 'src/app/core/notifications';
import { ApiProblem } from '../api/api-problem';
import { problemInterceptor } from '../api/problem-interceptor';
import { AuthStore } from './auth-store';

const day = 24 * 60 * 60 * 1000;
const problemResponse = { status: 401, statusText: 'Unauthorized', headers: { 'Content-Type': 'application/problem+json' } };

describe('AuthStore', () => {
  let store: AuthStore;
  let http: HttpTestingController;
  let router: { navigateByUrl: ReturnType<typeof vi.fn>; navigate: ReturnType<typeof vi.fn> };
  let notifications: { showNotification: ReturnType<typeof vi.fn> };

  const account = { id: 'u1', firstName: 'Ria', lastName: 'Receiver', email: 'ria@gimmi.be', createdAt: '2020-01-01T00:00:00Z' };
  const expiresIn = (ms: number) => new Date(Date.now() + ms).toISOString();

  function stored(overrides: object = {}) {
    localStorage.setItem('currentUser', JSON.stringify({
      token: 'tok', expiresAt: expiresIn(7 * day),
      user: { id: 'u1', firstName: 'Ria', lastName: 'Receiver', fullName: 'Ria Receiver', email: 'ria@gimmi.be' },
      ...overrides
    }));
  }

  function create() {
    store = TestBed.inject(AuthStore);
    http = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => {
    localStorage.removeItem('currentUser');
    router = { navigateByUrl: vi.fn(), navigate: vi.fn() };
    notifications = { showNotification: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: Notifications, useValue: notifications },
        provideHttpClient(withXhr(), withInterceptors([problemInterceptor])),
        provideHttpClientTesting()
      ]
    });
    vi.spyOn(console, 'info').mockReturnValue(undefined);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('currentUser');
  });

  describe('at startup', () => {
    it('has nobody logged in without a stored session', () => {
      create();
      expect(store.user()).toBeNull();
      expect(store.token()).toBeNull();
    });

    it('restores the person and the token from a valid session', () => {
      stored();
      create();
      expect(store.user()?.fullName).toBe('Ria Receiver');
      expect(store.token()).toBe('tok');
    });

    it('treats a token of the old API (a bare string) as logged out, with a notice', () => {
      localStorage.setItem('currentUser', 'eyJhbGciOiJIUzI1NiJ9.e30.sig');
      create();
      expect(store.user()).toBeNull();
      expect(localStorage.getItem('currentUser')).toBeNull();
      expect(notifications.showNotification).toHaveBeenCalledWith(expect.stringContaining('verlopen'), 'warning', 'Uitgelogd');
    });

    it('treats an expired session as logged out', () => {
      stored({ expiresAt: expiresIn(-1000) });
      create();
      expect(store.user()).toBeNull();
      expect(localStorage.getItem('currentUser')).toBeNull();
    });
  });

  describe('login', () => {
    it('exchanges the credentials for a token, loads /me with it and keeps both', () => {
      create();
      let loggedIn: unknown;
      store.login('ria@gimmi.be', 'secret').subscribe(user => loggedIn = user);

      const tokenRequest = http.expectOne(environment.apiV2Url + 'auth/token');
      expect(tokenRequest.request.method).toBe('POST');
      expect(tokenRequest.request.body).toEqual({ email: 'ria@gimmi.be', password: 'secret' });
      tokenRequest.flush({ token: 'tok', tokenType: 'Bearer', expiresAt: expiresIn(7 * day) });

      expect(store.token()).toBe('tok'); // set before /me, for the interceptor
      http.expectOne(environment.apiV2Url + 'me').flush(account);

      expect(loggedIn).toEqual({ id: 'u1', firstName: 'Ria', lastName: 'Receiver', email: 'ria@gimmi.be', fullName: 'Ria Receiver' });
      expect(store.user()?.id).toBe('u1');
      expect(JSON.parse(localStorage.getItem('currentUser')!).token).toBe('tok');
    });

    it('passes on the problem of a wrong password and stays logged out', () => {
      create();
      let error: unknown;
      store.login('ria@gimmi.be', 'wrong').subscribe({ error: e => error = e });
      http.expectOne(environment.apiV2Url + 'auth/token').flush(
        { title: 'Invalid credentials', status: 401, code: 'invalid-credentials' }, problemResponse);
      expect(error).toBeInstanceOf(ApiProblem);
      expect((error as ApiProblem).code).toBe('invalid-credentials');
      expect(store.user()).toBeNull();
      expect(store.token()).toBeNull();
      expect(localStorage.getItem('currentUser')).toBeNull();
    });

    it('drops the token again when /me fails', () => {
      create();
      store.login('ria@gimmi.be', 'secret').subscribe({ error: () => undefined });
      http.expectOne(environment.apiV2Url + 'auth/token').flush({ token: 'tok', tokenType: 'Bearer', expiresAt: expiresIn(7 * day) });
      http.expectOne(environment.apiV2Url + 'me').flush({}, { status: 500, statusText: 'Error' });
      expect(store.token()).toBeNull();
    });
  });

  describe('renewIfNeeded', () => {
    it('does nothing when nobody is logged in', () => {
      create();
      store.renewIfNeeded().subscribe();
      http.expectNone(environment.apiV2Url + 'auth/token/renewal');
    });

    it('does nothing for a token younger than a day', () => {
      stored();
      create();
      store.renewIfNeeded().subscribe();
      http.expectNone(environment.apiV2Url + 'auth/token/renewal');
    });

    it('swaps a token older than a day for a new one', () => {
      stored({ expiresAt: expiresIn(5 * day) });
      create();
      store.renewIfNeeded().subscribe();
      const request = http.expectOne(environment.apiV2Url + 'auth/token/renewal');
      expect(request.request.method).toBe('POST');
      const fresh = expiresIn(7 * day);
      request.flush({ token: 'fresh', tokenType: 'Bearer', expiresAt: fresh });
      expect(store.token()).toBe('fresh');
      expect(store.user()?.id).toBe('u1');
      expect(JSON.parse(localStorage.getItem('currentUser')!)).toMatchObject({ token: 'fresh', expiresAt: fresh });
    });

    it('logs out with a notice and goes to the login when the token was refused', () => {
      stored({ expiresAt: expiresIn(5 * day) });
      create();
      store.renewIfNeeded().subscribe();
      http.expectOne(environment.apiV2Url + 'auth/token/renewal').flush(
        { title: 'Unauthenticated', status: 401, code: 'unauthenticated' }, problemResponse);
      expect(store.user()).toBeNull();
      expect(localStorage.getItem('currentUser')).toBeNull();
      expect(notifications.showNotification).toHaveBeenCalledWith(expect.stringContaining('verlopen'), 'warning', 'Uitgelogd');
      expect(router.navigate).toHaveBeenCalledWith(['/users/login']);
    });

    it('keeps the session when renewing fails for another reason', () => {
      vi.spyOn(console, 'error').mockReturnValue(undefined);
      stored({ expiresAt: expiresIn(5 * day) });
      create();
      store.renewIfNeeded().subscribe();
      http.expectOne(environment.apiV2Url + 'auth/token/renewal').flush({}, { status: 503, statusText: 'Unavailable' });
      expect(store.user()).not.toBeNull();
      expect(store.token()).toBe('tok');
    });
  });

  describe('after logging in', () => {
    beforeEach(() => {
      stored();
      create();
    });

    it('goes to the own list without an attempted url', () => {
      store.redirectAfterAuthentication();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/people/u1');
    });

    it('goes to the attempted url and forgets it', () => {
      store.attemptedUrl = '/people/p9';
      store.redirectAfterAuthentication();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/people/p9');
      expect(store.attemptedUrl).toBeNull();
    });

    it('welcomes the person by first name', () => {
      store.showAuthenticationConfirmation();
      expect(notifications.showNotification).toHaveBeenCalledWith(expect.any(String), 'success', 'Welkom Ria');
    });
  });
});
