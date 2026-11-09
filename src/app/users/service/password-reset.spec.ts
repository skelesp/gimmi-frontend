import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { environment } from 'src/environments/environment';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { PasswordReset } from './password-reset';

describe('PasswordReset', () => {
  let passwordReset: PasswordReset;
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
    passwordReset = TestBed.inject(PasswordReset);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('request: POST /password-resets with only the address (the server chooses the link)', () => {
    passwordReset.request('ria@gimmi.be').subscribe();
    const request = http.expectOne(environment.apiV2Url + 'password-resets');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'ria@gimmi.be' });
    request.flush(null, { status: 202, statusText: 'Accepted' });
  });

  it('get: GET /password-resets/{token}', () => {
    let info: unknown;
    passwordReset.get('tok1').subscribe(i => info = i);
    http.expectOne(environment.apiV2Url + 'password-resets/tok1').flush({ firstName: 'Ria', expiresAt: '2026-11-10T10:00:00Z' });
    expect(info).toEqual({ firstName: 'Ria', expiresAt: '2026-11-10T10:00:00Z' });
  });

  it('complete: PUT /password-resets/{token} and starts the session with the token from the answer', () => {
    const ria = testUser();
    auth.startSession.mockReturnValue(of(ria));
    let user: unknown;
    passwordReset.complete('tok1', 'nieuw-geheim-1').subscribe(u => user = u);
    const request = http.expectOne(environment.apiV2Url + 'password-resets/tok1');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ password: 'nieuw-geheim-1' });
    const answer = { token: 'new', tokenType: 'Bearer', expiresAt: '2026-11-17T10:00:00Z' };
    request.flush(answer);
    expect(auth.startSession).toHaveBeenCalledWith(answer);
    expect(user).toBe(ria);
  });
});
