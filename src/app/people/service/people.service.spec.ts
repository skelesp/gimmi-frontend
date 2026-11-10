import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';

import { environment } from 'src/environments/environment';
import { Person } from '../models/person.model';
import { PeopleService } from './people.service';

// What the v1 wish code still needs of a person, until sc-3288 and sc-3291.
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

    it('getPersonById: zet het antwoord om naar een Person', () => {
        let resultaat: Person;
        service.getPersonById('p1').subscribe(p => resultaat = p);
        http.expectOne(environment.apiUrl + 'people/p1').flush({ id: 'p1', firstName: 'Ria', lastName: 'Receiver' });
        expect(resultaat.fullName).toBe('Ria Receiver');
    });

    it('getPersonById: een fout van de API komt door', () => {
        let status: number;
        service.getPersonById('p1').subscribe({ error: e => status = e.status });
        http.expectOne(environment.apiUrl + 'people/p1').flush({}, { status: 404, statusText: 'Not Found' });
        expect(status).toBe(404);
    });

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
