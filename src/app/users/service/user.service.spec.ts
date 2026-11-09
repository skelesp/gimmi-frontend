import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { of } from 'rxjs';

import { environment } from 'src/environments/environment';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { UserService } from './user.service';

// Registreren (sc-3285) en wachtwoord vergeten/resetten (sc-3286) lopen nog over API v1; het inloggen
// zelf staat in AuthStore.
describe('UserService', () => {
    let service: UserService;
    let http: HttpTestingController;
    let auth: ReturnType<typeof fakeAuthStore>;

    beforeEach(() => {
        auth = fakeAuthStore();
        TestBed.configureTestingModule({
            providers: [
                { provide: AuthStore, useValue: auth },
                provideHttpClient(withXhr(), withInterceptorsFromDi()),
                provideHttpClientTesting()
            ]
        });
        service = TestBed.inject(UserService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    describe('register', () => {
        const aanvraag = { firstname: 'Ria', lastname: 'Receiver', email: 'ria@gimmi.be', birthday: '1990-05-17', password: 'geheim' };

        it('post naar /people en logt daarna in op v2 met dezelfde gegevens', () => {
            const ria = testUser({ firstName: 'Ria' });
            auth.login.mockReturnValue(of(ria));
            let nieuw: unknown;
            service.register(aanvraag).subscribe(u => nieuw = u);
            const req = http.expectOne(environment.apiUrl + 'people');
            expect(req.request.body).toEqual(aanvraag);
            req.flush({ success: true, message: 'ok', token: 'v1-token' });
            expect(auth.login).toHaveBeenCalledWith('ria@gimmi.be', 'geheim');
            expect(nieuw).toBe(ria);
        });

        it('bestaand adres: de foutmelding bevat "User already exists" (daarop reageert het registratiescherm)', () => {
            let fout: string;
            service.register({ ...aanvraag, birthday: null }).subscribe({ error: e => fout = e });
            http.expectOne(environment.apiUrl + 'people').flush({ error: 'User already exists' }, { status: 500, statusText: 'Error' });
            expect(fout).toContain('User already exists');
            expect(auth.login).not.toHaveBeenCalled();
        });
    });

    describe('wachtwoord vergeten en resetten', () => {
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
