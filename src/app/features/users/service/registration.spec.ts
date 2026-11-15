import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { environment } from 'src/environments/environment';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { Registration } from './registration';

describe('Registration', () => {
  let registration: Registration;
  let http: HttpTestingController;
  let auth: ReturnType<typeof fakeAuthStore> & { startSession: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    auth = { ...fakeAuthStore(), startSession: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: auth },
        provideHttpClient(withXhr()),
        provideHttpClientTesting()
      ]
    });
    registration = TestBed.inject(Registration);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('start: POST /registrations with the address', () => {
    registration.start('ria@gimmi.be').subscribe();
    const request = http.expectOne(environment.apiV2Url + 'registrations');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'ria@gimmi.be' });
    request.flush(null, { status: 202, statusText: 'Accepted' });
  });

  it('get: GET /registrations/{token} as a resource that waits for a token', async () => {
    const token = signal<string | null>(null);
    const info = TestBed.runInInjectionContext(() => registration.get(token));
    TestBed.tick();
    http.expectNone(environment.apiV2Url + 'registrations/tok1');

    token.set('tok1');
    TestBed.tick();
    http.expectOne(environment.apiV2Url + 'registrations/tok1').flush({ email: 'ria@gimmi.be', expiresAt: '2026-11-10T10:00:00Z' });
    await Promise.resolve();
    TestBed.tick();
    expect(info.value()).toEqual({ email: 'ria@gimmi.be', expiresAt: '2026-11-10T10:00:00Z' });
  });

  it('complete: PUT /registrations/{token} and starts the session with the token from the answer', () => {
    const ria = testUser();
    auth.startSession.mockReturnValue(of(ria));
    let user: unknown;
    const details = { firstName: 'Ria', lastName: 'Receiver', password: 'geheim-genoeg', birthday: '1990-05-17' };
    registration.complete('tok1', details).subscribe(u => user = u);
    const request = http.expectOne(environment.apiV2Url + 'registrations/tok1');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(details);
    const answer = { token: 'new', tokenType: 'Bearer', expiresAt: '2026-11-17T10:00:00Z' };
    request.flush(answer, { status: 201, statusText: 'Created' });
    expect(auth.startSession).toHaveBeenCalledWith(answer);
    expect(user).toBe(ria);
  });
});
