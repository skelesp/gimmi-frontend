import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { environment } from 'src/environments/environment';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { PasswordChange } from './password-change';

describe('PasswordChange', () => {
  let http: HttpTestingController;
  let auth: ReturnType<typeof fakeAuthStore> & { startSession: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    auth = { ...fakeAuthStore(), startSession: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: AuthStore, useValue: auth }, provideHttpClient(withXhr()), provideHttpClientTesting()]
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('PUT /me/password and carries on with the new token from the answer', () => {
    const ilse = testUser();
    auth.startSession.mockReturnValue(of(ilse));
    let user: unknown;
    TestBed.inject(PasswordChange).change('oud-geheim-1', 'nieuw-geheim-1').subscribe(u => user = u);
    const request = http.expectOne(environment.apiV2Url + 'me/password');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ currentPassword: 'oud-geheim-1', newPassword: 'nieuw-geheim-1' });
    const answer = { token: 'new', tokenType: 'Bearer', expiresAt: '2026-11-30T10:00:00Z' };
    request.flush(answer);
    expect(auth.startSession).toHaveBeenCalledWith(answer);
    expect(user).toBe(ilse);
  });
});
