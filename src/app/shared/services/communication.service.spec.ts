import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { environment } from 'src/environments/environment';
import { CommunicationService, MailInfo } from './communication.service';
import { NotificationService } from './notification.service';

// sc-1998: mail versturen via de API, met melding aan de gebruiker.
describe('CommunicationService', () => {
  let service: CommunicationService;
  let http: HttpTestingController;
  let notifications: jasmine.SpyObj<NotificationService>;
  const mail: MailInfo = { to: 'a@gimmi.be', subject: 'Onderwerp', html: '<p>Hallo</p>' };

  beforeEach(() => {
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['showNotification']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: NotificationService, useValue: notifications }]
    });
    service = TestBed.inject(CommunicationService);
    http = TestBed.inject(HttpTestingController);
    spyOn(console, 'info');
  });

  afterEach(() => http.verify());

  it('post de mail naar /email en meldt succes', () => {
    service.sendMail(mail);
    const req = http.expectOne(environment.apiUrl + 'email');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mail);
    req.flush('ok');
    expect(notifications.showNotification).toHaveBeenCalledWith('De mail werd verzonden.', 'success');
  });

  it('serverfout: foutmelding aan de gebruiker', () => {
    service.sendMail(mail);
    http.expectOne(environment.apiUrl + 'email').flush('fout', { status: 500, statusText: 'Server Error' });
    expect(notifications.showNotification).toHaveBeenCalledWith(jasmine.stringMatching('Er ging iets mis'), 'error');
  });

  it('401: geen eigen foutmelding (de auth-interceptor handelt dat af)', () => {
    service.sendMail(mail);
    http.expectOne(environment.apiUrl + 'email').flush('fout', { status: 401, statusText: 'Unauthorized' });
    expect(notifications.showNotification).not.toHaveBeenCalled();
  });
});
