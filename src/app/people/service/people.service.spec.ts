import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';

import { environment } from 'src/environments/environment';
import { PeopleService } from './people.service';

// What the v1 reservation code still needs of a person, until sc-3291.
describe('PeopleService', () => {
    let service: PeopleService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(withXhr()), provideHttpClientTesting()]
        });
        service = TestBed.inject(PeopleService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('getEmailById: zonder id een fout zonder request, met id het adres', () => {
        let fout: Error;
        let email: string;
        service.getEmailById('').subscribe({ error: e => fout = e });
        service.getEmailById('p1').subscribe(e => email = e);
        http.expectOne(environment.apiUrl + 'people/p1/email').flush('a@b.be');
        expect(fout.message).toBe('No personId provided');
        expect(email).toBe('a@b.be');
    });
});
