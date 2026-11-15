import type { Mock } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { environment } from 'src/environments/environment';
import { Notifications } from 'src/app/core/notifications';
import { AuthStore } from '../../../core/auth/auth-store';
import { fakeAuthStore, testUser } from '../../../core/auth/auth-store.testing';
import { authErrorInterceptor } from './auth-error-interceptor';

// Reaction to 401 and 403 from the API. The case "401 while someone is logged in" calls logout(),
// and that reloads the page; so that path is not covered here.
describe('authErrorInterceptor', () => {
    let http: HttpClient;
    let backend: HttpTestingController;
    let router: { navigate: Mock; url: string };
    let notifications: Record<string, Mock>;
    let users: ReturnType<typeof fakeAuthStore>;

    function request(url: string, status: number): { status: number } {
        let error: { status: number };
        http.get(url).subscribe({ error: e => error = e });
        backend.expectOne(url).flush({ message: 'x' }, { status, statusText: 'Fout' });
        return error;
    }

    beforeEach(() => {
        router = Object.assign({
            navigate: vi.fn().mockName("Router.navigate")
        }, { url: '/people/p9' });
        notifications = {
            showNotification: vi.fn().mockName("Notifications.showNotification")
        };
        users = fakeAuthStore();
        TestBed.configureTestingModule({
            imports: [],
            providers: [
                { provide: Router, useValue: router },
                { provide: Notifications, useValue: notifications },
                { provide: AuthStore, useValue: users },
                provideHttpClient(withXhr(), withInterceptors([authErrorInterceptor])),
                provideHttpClientTesting()
            ]
        });
        http = TestBed.inject(HttpClient);
        backend = TestBed.inject(HttpTestingController);
    });

    afterEach(() => backend.verify());

    it('401: notice "Login vereist", to login and remember the current page', () => {
        const error = request('/api/wish/w1', 401);
        expect(error.status).toBe(401);
        expect(notifications.showNotification).toHaveBeenCalledWith(expect.any(String), 'error', 'Login vereist');
        expect(users.attemptedUrl).toBe('/people/p9');
        expect(router.navigate).toHaveBeenCalledWith(['users/login'], { queryParams: {} });
        expect(users.logout).not.toHaveBeenCalled();
    });

    it('401 on the login call itself (auth/token): no notice, no navigation, do not remember the login page', () => {
        // Otherwise the next successful login sends you back to the login screen.
        router.url = '/users/login';
        const error = request(environment.apiV2Url + 'auth/token', 401);
        expect(error.status).toBe(401);
        expect(notifications.showNotification).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
        expect(users.attemptedUrl).toBeNull();
    });

    it('401 on another v2 call: to login', () => {
        request(environment.apiV2Url + 'me', 401);
        expect(router.navigate).toHaveBeenCalledWith(['users/login'], { queryParams: {} });
    });

    it('403 on v2: no notice, the caller decides', () => {
        const error = request(environment.apiV2Url + 'me/password', 403);
        expect(error.status).toBe(403);
        expect(notifications.showNotification).not.toHaveBeenCalled();
    });

    it('401 from a /users/ page: do not remember that page as return URL', () => {
        router.url = '/users/register';
        request('/api/people', 401);
        expect(users.attemptedUrl).toBeNull();
        expect(router.navigate).toHaveBeenCalledWith(['users/login'], { queryParams: {} });
    });

    it('401 for a logged-in user: log out and pass the email address to the login', () => {
        users.user.set(testUser());
        request('/api/wish/w1', 401);
        expect(users.logout).toHaveBeenCalledWith('401_RESPONSE');
        expect(router.navigate).toHaveBeenCalledWith(['users/login'], { queryParams: { e: 'ilse@gimmi.be' } });
    });

    it('403: notice about missing permissions, no navigation', () => {
        const error = request('/api/people/p2', 403);
        expect(error.status).toBe(403);
        expect(notifications.showNotification).toHaveBeenCalledWith(expect.stringMatching('niet gemachtigd'), 'error');
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('other errors: passed on unchanged, no notice', () => {
        const error = request('/api/wish/w1', 500);
        expect(error.status).toBe(500);
        expect(notifications.showNotification).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
    });
});
