import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { environment } from 'src/environments/environment';
import { CommunicationService } from 'src/app/shared/services/communication.service';
import { UserService } from 'src/app/users/service/user.service';
import { Person } from '../models/person.model';
import { PeopleService } from './people.service';

describe('PeopleService', () => {
  let service: PeopleService;
  let http: HttpTestingController;
  let userService: { currentUser: { id: string } | undefined };
  let communication: jasmine.SpyObj<CommunicationService>;

  beforeEach(() => {
    userService = { currentUser: { id: 'ik' } };
    communication = jasmine.createSpyObj<CommunicationService>('CommunicationService', ['sendMail']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: CommunicationService, useValue: communication }
      ]
    });
    service = TestBed.inject(PeopleService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // sc-2439: mag niet true geven als er geen persoon of geen gebruiker is.
  describe('isEqualToCurrentUser', () => {
    it('zelfde id als de ingelogde gebruiker: true', () => {
      expect(service.isEqualToCurrentUser(new Person('ik', 'A', 'B'))).toBeTrue();
    });

    it('ander id: false', () => {
      expect(service.isEqualToCurrentUser(new Person('jij', 'A', 'B'))).toBeFalse();
    });

    it('geen persoon: niet waar (undefined)', () => {
      expect(service.isEqualToCurrentUser(undefined)).toBeFalsy();
    });

    it('niemand ingelogd: false', () => {
      userService.currentUser = undefined;
      expect(service.isEqualToCurrentUser(new Person('ik', 'A', 'B'))).toBeFalse();
    });
  });

  describe('getPersonById', () => {
    it('zet het antwoord om naar een Person, met verjaardag en extra info', () => {
      let resultaat: Person;
      service.getPersonById('p1').subscribe(p => resultaat = p);
      http.expectOne(environment.apiUrl + 'people/p1').flush({
        id: 'p1', firstName: 'Ria', lastName: 'Receiver', birthday: '1990-05-17', extraInfo: { likes: [], dislikes: [] }
      });
      expect(resultaat.fullName).toBe('Ria Receiver');
      expect(resultaat.birthday as unknown).toBe('1990-05-17');
      expect(resultaat.extraInfo).toEqual({ likes: [], dislikes: [] });
    });

    it('fout van de API: foutmelding met de statuscode', () => {
      spyOn(console, 'error');
      let fout: string;
      service.getPersonById('p1').subscribe({ error: e => fout = e });
      http.expectOne(environment.apiUrl + 'people/p1').flush({ message: 'weg' }, { status: 404, statusText: 'Not Found' });
      expect(fout).toContain('Gimmi API returned code 404');
    });
  });

  describe('findPersonByEmail', () => {
    it('zoekt op e-mail', () => {
      let resultaat: Person;
      service.findPersonByEmail('a@b.be').subscribe(p => resultaat = p);
      http.expectOne(environment.apiUrl + 'people/email/a@b.be').flush({ id: 'p2', firstName: 'An', lastName: 'B' });
      expect(resultaat.id).toBe('p2');
    });

    it('zonder e-mail: fout, geen request', () => {
      let fout: Error;
      service.findPersonByEmail('').subscribe({ error: e => fout = e });
      expect(fout.message).toContain('No email provided');
    });
  });

  describe('retrievePeopleList en addPerson', () => {
    it('vult de lijst uit de API en voegt lokaal personen toe', () => {
      let lijst: Person[] = [];
      service.people.subscribe(p => lijst = p);
      service.retrievePeopleList();
      http.expectOne(environment.apiUrl + 'people').flush([{ id: 'p1', firstName: 'A', lastName: 'B' }]);
      expect(lijst.map(p => p.id)).toEqual(['p1']);

      service.addPerson(new Person('p2', 'C', 'D'));
      expect(lijst.map(p => p.id)).toEqual(['p1', 'p2']);
    });
  });

  describe('getNameById en getEmailById', () => {
    it('zonder id: fout zonder request', () => {
      let fouten: string[] = [];
      service.getNameById('').subscribe({ error: e => fouten.push(e) });
      service.getEmailById('').subscribe({ error: e => fouten.push(e) });
      expect(fouten).toEqual(['No personId provided', 'No personId provided']);
    });

    it('met id: vraagt naam en e-mail op', () => {
      let naam: Person; let email: string;
      service.getNameById('p1').subscribe(p => naam = p);
      service.getEmailById('p1').subscribe(e => email = e);
      http.expectOne(environment.apiUrl + 'people/p1/name').flush({ id: 'p1', firstName: 'A', lastName: 'B' });
      http.expectOne(environment.apiUrl + 'people/p1/email').flush('a@b.be');
      expect(naam.fullName).toBe('A B');
      expect(email).toBe('a@b.be');
    });
  });

  describe('updateExtraInfo', () => {
    it('stuurt likes en dislikes en geeft de bijgewerkte persoon terug', () => {
      let resultaat: Person;
      service.updateExtraInfo('p1', [], []).subscribe(p => resultaat = p);
      const req = http.expectOne(environment.apiUrl + 'people/p1/extraInfo');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ likes: [], dislikes: [] });
      req.flush({ id: 'p1', firstName: 'A', lastName: 'B', extraInfo: { likes: [], dislikes: [] } });
      expect(resultaat.extraInfo).toBeDefined();
    });
  });

  describe('invite', () => {
    it('stuurt een uitnodigingsmail met een link naar de registratie', () => {
      service.invite({ email: 'nieuw@gimmi.be', notifyOnRegistration: null });
      const mail = communication.sendMail.calls.mostRecent().args[0];
      expect(mail.to).toBe('nieuw@gimmi.be');
      expect(mail.html).toContain('/users/register?e=nieuw@gimmi.be');
    });
  });
});
