import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { SocialAuthService } from 'angularx-social-login';
import { NEVER } from 'rxjs';

import { environment } from 'src/environments/environment';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { User } from '../models/user.model';
import { UserService } from './user.service';

// sc-1995 (auth local), sc-2004 (wachtwoord vergeten/reset), sc-2041 (attemptedUrl).
// logout() herlaadt de pagina en wordt daarom hier niet aangeroepen.
describe('UserService', () => {
  let service: UserService;
  let http: HttpTestingController;
  let router: jasmine.SpyObj<Router>;
  let notifications: jasmine.SpyObj<NotificationService>;

  function base64url(obj: object): string {
    return btoa(JSON.stringify(obj)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  function token(overrides: object = {}): string {
    const payload = {
      id: 'u1', firstName: 'Ria', lastName: 'Receiver', email: 'ria@gimmi.be',
      loginStrategy: 'local', accounts: [], exp: Math.floor(Date.now() / 1000) + 3600, ...overrides
    };
    return `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(payload)}.handtekening`;
  }

  function maakService() {
    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => {
    localStorage.removeItem('currentUser');
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['showNotification']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: Router, useValue: router },
        { provide: NotificationService, useValue: notifications },
        { provide: SocialAuthService, useValue: { authState: NEVER, signOut: () => Promise.resolve() } }
      ]
    });
    spyOn(console, 'info');
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('currentUser');
  });

  it('zonder token in localStorage: niemand ingelogd', () => {
    maakService();
    expect(service.currentUser).toBeNull();
  });

  it('geldig token in localStorage: gebruiker uit het token', () => {
    localStorage.setItem('currentUser', token());
    maakService();
    expect(service.currentUser).toEqual(jasmine.any(User));
    expect(service.currentUser.id).toBe('u1');
    expect(service.currentUser.fullName).toBe('Ria Receiver');
    expect(service.currentUser.loginStrategy).toBe('local');
  });

  describe('authenticate', () => {
    it('post de gegevens met account "local", bewaart het token en zet de gebruiker', () => {
      maakService();
      let ingelogd: User;
      const users: User[] = [];
      service.currentUser$.subscribe(u => users.push(u));

      service.authenticate({ email: 'ria@gimmi.be', password: 'geheim' }).subscribe(u => ingelogd = u);
      const req = http.expectOne(environment.apiUrl + 'authenticate');
      expect(req.request.body).toEqual({ email: 'ria@gimmi.be', password: 'geheim', account: 'local' });
      const t = token();
      req.flush({ success: true, message: 'ok', token: t });

      expect(localStorage.getItem('currentUser')).toBe(t);
      expect(ingelogd.id).toBe('u1');
      expect(users.map(u => u?.id)).toEqual([undefined, 'u1']);
    });

    it('fout wachtwoord: foutmelding met code en boodschap, geen gebruiker', () => {
      maakService();
      let fout: string;
      service.authenticate({ email: 'ria@gimmi.be', password: 'mis' }).subscribe({ error: e => fout = e });
      http.expectOne(environment.apiUrl + 'authenticate')
        .flush({ message: 'Authentication failed' }, { status: 401, statusText: 'Unauthorized' });
      expect(fout).toBe('Gimmi API returned code 401 with message "Authentication failed"');
      expect(service.currentUser).toBeNull();
      expect(localStorage.getItem('currentUser')).toBeNull();
    });
  });

  describe('register', () => {
    it('post naar /people en logt de nieuwe gebruiker meteen in', () => {
      maakService();
      let nieuw: User;
      const aanvraag = { firstname: 'Ria', lastname: 'Receiver', email: 'ria@gimmi.be', birthday: '1990-05-17', password: 'geheim' };
      service.register(aanvraag).subscribe(u => nieuw = u);
      const req = http.expectOne(environment.apiUrl + 'people');
      expect(req.request.body).toEqual(aanvraag);
      req.flush({ success: true, message: 'ok', token: token() });
      expect(nieuw.firstName).toBe('Ria');
    });

    it('bestaand adres: de foutmelding bevat "User already exists" (daarop reageert het registratiescherm)', () => {
      maakService();
      let fout: string;
      service.register({ firstname: 'R', lastname: 'R', email: 'ria@gimmi.be', birthday: null, password: 'x' })
        .subscribe({ error: e => fout = e });
      http.expectOne(environment.apiUrl + 'people').flush({ error: 'User already exists' }, { status: 500, statusText: 'Error' });
      expect(fout).toContain('User already exists');
    });
  });

  describe('redirectAfterAuthentication', () => {
    beforeEach(() => {
      localStorage.setItem('currentUser', token());
      maakService();
    });

    it('zonder attemptedUrl: naar de eigen wensenlijst', () => {
      service.redirectAfterAuthentication();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/people/u1');
    });

    it('met attemptedUrl: daarheen, en de attemptedUrl wordt gewist', () => {
      service.attemptedUrl = '/people/p9';
      service.redirectAfterAuthentication();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/people/p9');
      expect(service.attemptedUrl).toBeNull();
    });
  });

  it('showAuthenticationConfirmation: welkomstmelding met de voornaam', () => {
    localStorage.setItem('currentUser', token());
    maakService();
    service.showAuthenticationConfirmation();
    expect(notifications.showNotification).toHaveBeenCalledWith(jasmine.any(String), 'success', 'Welkom Ria');
  });

  describe('wachtwoord vergeten en resetten', () => {
    beforeEach(() => maakService());

    it('requestPasswordReset: DELETE met e-mail en de resetroute van deze site', () => {
      service.requestPasswordReset('ria@gimmi.be').subscribe();
      const req = http.expectOne(environment.apiUrl + 'people/account/local');
      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toEqual({ email: 'ria@gimmi.be', resetPasswordRoute: environment.rootSiteUrl + '/users/resetpassword' });
      req.flush({});
    });

    it('validatePasswordResetToken: GET met het token', () => {
      let antwoord: any;
      service.validatePasswordResetToken('abc').subscribe(a => antwoord = a);
      http.expectOne(environment.apiUrl + 'people/account/local/abc').flush({ firstName: 'Ria', token: 'abc', expiresOn: null });
      expect(antwoord.firstName).toBe('Ria');
    });

    it('validatePasswordResetToken zonder token: geen request', () => {
      expect(service.validatePasswordResetToken('')).toBeUndefined();
    });

    it('resetPassword: PUT met het nieuwe wachtwoord als pw', () => {
      service.resetPassword('nieuw', 'abc').subscribe();
      const req = http.expectOne(environment.apiUrl + 'people/account/local/abc');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ pw: 'nieuw' });
      req.flush({ email: 'ria@gimmi.be', usedToken: 'abc' });
    });

    it('resetPassword zonder wachtwoord of token: geen request', () => {
      expect(service.resetPassword('', 'abc')).toBeUndefined();
      expect(service.resetPassword('nieuw', '')).toBeUndefined();
    });
  });
});
