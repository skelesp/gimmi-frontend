import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from 'src/environments/environment';
import { AuthStore } from '../../../core/auth/auth-store';
import { jwtInterceptor } from './jwt-interceptor';

// The token only goes to our own API, and only if someone is logged in:
// an external source (such as the images on the image domain) never gets to see it.
describe('jwtInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let token: ReturnType<typeof signal<string | null>>;

  function header(url: string): string {
    http.get(url).subscribe();
    const req = backend.expectOne(url);
    req.flush({});
    return req.request.headers.get('Authorization');
  }

  beforeEach(() => {
    token = signal<string | null>(null);
    TestBed.configureTestingModule({
    imports: [],
    providers: [
        { provide: AuthStore, useValue: { token } },
        provideHttpClient(withXhr(), withInterceptors([jwtInterceptor])),
        provideHttpClientTesting()
    ]
});
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('logged in, to the API: the token as Bearer', () => {
    token.set('jwt-123');
    expect(header(environment.apiV2Url + 'me')).toBe('Bearer jwt-123');
  });

  it('logged in, to another address: no header', () => {
    token.set('jwt-123');
    expect(header('https://img.gimmi.be/wishes/a.jpg')).toBeNull();
  });

  it('not logged in or without token: no header', () => {
    expect(header(environment.apiV2Url + 'people')).toBeNull();
    token.set('');
    expect(header(environment.apiV2Url + 'people')).toBeNull();
  });
});
