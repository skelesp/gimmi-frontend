import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from 'src/environments/environment';
import { ReportingService } from './reporting.service';

// Gegevens voor de lean startup-grafiek (sc-1992).
describe('ReportingService', () => {
  let service: ReportingService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ReportingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('haalt reporting/leanstartup op', () => {
    let resultaat: any;
    service.getLeanStartupData().subscribe(r => resultaat = r);
    const req = http.expectOne(environment.apiUrl + 'reporting/leanstartup');
    expect(req.request.method).toBe('GET');
    req.flush({ labels: ['a'], series: ['s'], data: [[1]] });
    expect(resultaat).toEqual({ labels: ['a'], series: ['s'], data: [[1]] });
  });

  it('foutcode van de API: foutmelding met de code', () => {
    spyOn(console, 'error');
    let fout: string;
    service.getLeanStartupData().subscribe({ error: e => fout = e });
    http.expectOne(environment.apiUrl + 'reporting/leanstartup').flush({ error: 'stuk' }, { status: 500, statusText: 'Server Error' });
    expect(fout).toBe('Gimmi API returned code 500. Error info: {"error":"stuk"}');
  });

  it('netwerkfout: foutmelding met de boodschap', () => {
    spyOn(console, 'error');
    let fout: string;
    service.getLeanStartupData().subscribe({ error: e => fout = e });
    http.expectOne(environment.apiUrl + 'reporting/leanstartup').error(new ErrorEvent('Network', { message: 'offline' }));
    expect(fout).toBe('An error occurred:offline');
  });
});
