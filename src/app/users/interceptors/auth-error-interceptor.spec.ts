import type { Mock } from "vitest";
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { NotificationService } from 'src/app/shared/services/notification.service';
import { UserService } from '../service/user.service';
import { authErrorInterceptor } from './auth-error-interceptor';

// Reactie op 401 en 403 van de API. Het geval "401 terwijl iemand ingelogd is" roept logout()
// aan, en dat herlaadt de pagina; dat pad staat hier dus niet in.
describe('authErrorInterceptor', () => {
    let http: HttpClient;
    let backend: HttpTestingController;
    let router: Record<string, any> & {
        url: string;
    };
    let notifications: Record<string, any>;
    let users: {
        currentUser: any;
        attemptedUrl: string;
        logout: Mock;
    };

    function vraag(url: string, status: number): any {
        let fout: any;
        http.get(url).subscribe({ error: e => fout = e });
        backend.expectOne(url).flush({ message: 'x' }, { status, statusText: 'Fout' });
        return fout;
    }

    beforeEach(() => {
        router = Object.assign({
            navigate: vi.fn().mockName("Router.navigate")
        }, { url: '/people/p9' });
        notifications = {
            showNotification: vi.fn().mockName("NotificationService.showNotification")
        };
        users = { currentUser: null, attemptedUrl: null, logout: vi.fn().mockName('logout') };
        TestBed.configureTestingModule({
            imports: [],
            providers: [
                { provide: Router, useValue: router },
                { provide: NotificationService, useValue: notifications },
                { provide: UserService, useValue: users },
                provideHttpClient(withXhr(), withInterceptors([authErrorInterceptor])),
                provideHttpClientTesting()
            ]
        });
        http = TestBed.inject(HttpClient);
        backend = TestBed.inject(HttpTestingController);
    });

    afterEach(() => backend.verify());

    it('401: melding "Login vereist", naar login en de huidige pagina onthouden', () => {
        const fout = vraag('/api/wish/w1', 401);
        expect(fout.status).toBe(401);
        expect(notifications.showNotification).toHaveBeenCalledWith(expect.any(String), 'error', 'Login vereist');
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

    it('401 voor een ingelogde gebruiker: uitloggen en het e-mailadres meegeven aan de login', () => {
        users.currentUser = { email: 'ria@gimmi.be' };
        vraag('/api/wish/w1', 401);
        expect(users.logout).toHaveBeenCalledWith('401_RESPONSE');
        expect(router.navigate).toHaveBeenCalledWith(['users/login'], { queryParams: { e: 'ria@gimmi.be' } });
    });

    it('403: melding over ontbrekende rechten, geen navigatie', () => {
        const fout = vraag('/api/people/p2', 403);
        expect(fout.status).toBe(403);
        expect(notifications.showNotification).toHaveBeenCalledWith(expect.stringMatching('niet gemachtigd'), 'error');
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('andere fouten: ongewijzigd doorgegeven, geen melding', () => {
        const fout = vraag('/api/wish/w1', 500);
        expect(fout.status).toBe(500);
        expect(notifications.showNotification).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
    });
});
