import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { environment } from 'src/environments/environment';
import { UserService } from '../service/user.service';
import { JwtInterceptor } from './jwt.interceptor';

// Het token gaat alleen mee naar de eigen API, en alleen als iemand ingelogd is:
// een externe bron (zoals de afbeeldingen op het beelddomein) krijgt het nooit te zien.
describe('JwtInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let users: { currentUser: any };

  function header(url: string): string {
    http.get(url).subscribe();
    const req = backend.expectOne(url);
    req.flush({});
    return req.request.headers.get('Authorization');
  }

  beforeEach(() => {
    users = { currentUser: null };
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
        { provide: UserService, useValue: users }
      ]
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('ingelogd, naar de API: het token als Authorization-header', () => {
    users.currentUser = { token: 'jwt-123' };
    expect(header(environment.apiUrl + 'wish/w1')).toBe('jwt-123');
  });

  it('ingelogd, naar een ander adres: geen header', () => {
    users.currentUser = { token: 'jwt-123' };
    expect(header('https://img.gimmi.be/wishes/a.jpg')).toBeNull();
  });

  it('niet ingelogd of zonder token: geen header', () => {
    expect(header(environment.apiUrl + 'people')).toBeNull();
    users.currentUser = { token: '' };
    expect(header(environment.apiUrl + 'people')).toBeNull();
  });
});
