import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from 'src/environments/environment';
import { AuthStore } from '../../core/auth/auth-store';
import { jwtInterceptor } from './jwt-interceptor';

// Het token gaat alleen mee naar de eigen API, en alleen als iemand ingelogd is:
// een externe bron (zoals de afbeeldingen op het beelddomein) krijgt het nooit te zien.
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

  it('ingelogd, naar de API: het token als Authorization-header', () => {
    token.set('jwt-123');
    expect(header(environment.apiUrl + 'wish/w1')).toBe('jwt-123');
  });

  it('ingelogd, naar API v2: het token als Bearer', () => {
    token.set('jwt-123');
    expect(header(environment.apiV2Url + 'me')).toBe('Bearer jwt-123');
  });

  it('ingelogd, naar een ander adres: geen header', () => {
    token.set('jwt-123');
    expect(header('https://img.gimmi.be/wishes/a.jpg')).toBeNull();
  });

  it('niet ingelogd of zonder token: geen header', () => {
    expect(header(environment.apiUrl + 'people')).toBeNull();
    token.set('');
    expect(header(environment.apiUrl + 'people')).toBeNull();
  });
});
