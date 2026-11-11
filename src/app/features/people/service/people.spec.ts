import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';

import { environment } from 'src/environments/environment';
import { People, PersonProfile } from './people';

const ria: PersonProfile = {
    id: 'p1', firstName: 'Ria', lastName: 'Receiver', likes: [{ text: 'Boeken', url: null }], dislikes: [],
    viewer: { isSelf: true, can: { update: true } }
};

describe('People', () => {
    let people: People;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(withXhr()), provideHttpClientTesting()] });
        people = TestBed.inject(People);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('search: GET /people?q= and hands over the items', () => {
        let found: unknown;
        people.search('ria').subscribe(r => found = r);
        const request = http.expectOne(environment.apiV2Url + 'people?q=ria');
        expect(request.request.method).toBe('GET');
        request.flush({ items: [{ id: 'p1', firstName: 'Ria', lastName: 'Receiver' }], nextCursor: null });
        expect(found).toEqual([{ id: 'p1', firstName: 'Ria', lastName: 'Receiver' }]);
    });

    it('get: GET /people/{id}', () => {
        let profile: unknown;
        people.get('p1').subscribe(p => profile = p);
        http.expectOne(environment.apiV2Url + 'people/p1').flush(ria);
        expect(profile).toEqual(ria);
    });

    it('updatePreferences: PATCH as merge-patch with likes and dislikes, returns the profile', () => {
        let profile: unknown;
        people.updatePreferences('p1', { likes: [], dislikes: [{ text: 'Sokken', url: null }] }).subscribe(p => profile = p);
        const request = http.expectOne(environment.apiV2Url + 'people/p1');
        expect(request.request.method).toBe('PATCH');
        expect(request.request.headers.get('Content-Type')).toBe('application/merge-patch+json');
        expect(request.request.body).toEqual({ likes: [], dislikes: [{ text: 'Sokken', url: null }] });
        request.flush(ria);
        expect(profile).toEqual(ria);
    });

    it('invite: POST /invitations with the address only', () => {
        people.invite('nieuw@gimmi.be').subscribe();
        const request = http.expectOne(environment.apiV2Url + 'invitations');
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual({ email: 'nieuw@gimmi.be' });
        request.flush(null, { status: 202, statusText: 'Accepted' });
    });
});
