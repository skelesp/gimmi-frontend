import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BaseChartDirective, NgChartsModule } from 'ng2-charts';
import { of, throwError } from 'rxjs';

import { NotificationService } from 'src/app/shared/services/notification.service';
import { LeanStartupRespone, ReportingService } from '../../services/reporting.service';
import { LeanStartupComponent } from './lean-startup.component';

// Lean startup-grafiek (sc-1992). Rendert echt met ng2-charts en Chart.js: na de upgrade naar
// Angular 13 tekende de grafiek niets meer (sc-2721).
describe('LeanStartupComponent', () => {
  let fixture: ComponentFixture<LeanStartupComponent>;
  let reporting: jasmine.SpyObj<ReportingService>;
  let notifications: jasmine.SpyObj<NotificationService>;
  const antwoord: LeanStartupRespone = {
    labels: ['2026-08', '2026-09', '2026-10'],
    series: ['Nieuwe gebruikers', 'Actieve gebruikers'],
    data: [[3, 5, 8], [10, 12, 15]]
  };

  function toon() {
    fixture = TestBed.createComponent(LeanStartupComponent);
    fixture.detectChanges();
  }

  function grafiek(): BaseChartDirective {
    return fixture.debugElement.query(el => el.name === 'canvas').injector.get(BaseChartDirective);
  }

  beforeEach(async () => {
    reporting = jasmine.createSpyObj<ReportingService>('ReportingService', ['getLeanStartupData']);
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['showNotification']);
    spyOn(console, 'info');
    await TestBed.configureTestingModule({
      imports: [NgChartsModule],
      declarations: [LeanStartupComponent],
      providers: [
        { provide: ReportingService, useValue: reporting },
        { provide: NotificationService, useValue: notifications }
      ]
    }).compileComponents();
  });

  it('zet de twee reeksen om naar een lijngrafiek met de maanden als labels', () => {
    reporting.getLeanStartupData.and.returnValue(of(antwoord));
    toon();
    const data = fixture.componentInstance.lineChartData;
    expect(data.labels).toEqual(antwoord.labels);
    expect(data.datasets.map(d => [d.label, d.data])).toEqual([
      ['Nieuwe gebruikers', [3, 5, 8]],
      ['Actieve gebruikers', [10, 12, 15]]
    ]);
  });

  it('tekent een echte Chart.js-lijngrafiek met beide reeksen (sc-2721)', () => {
    reporting.getLeanStartupData.and.returnValue(of(antwoord));
    toon();
    const chart = grafiek().chart;
    expect(chart).toBeTruthy();
    expect((chart.config as any).type).toBe('line');
    expect(chart.data.datasets.length).toBe(2);
    expect(chart.data.labels).toEqual(antwoord.labels);
    expect(chart.options.plugins.title.text).toBe('Lean startup dashboard');
  });

  it('y-as begint bij nul, legende rechts', () => {
    reporting.getLeanStartupData.and.returnValue(of(antwoord));
    toon();
    const opties: any = fixture.componentInstance.lineChartOptions;
    expect(opties.scales.y.beginAtZero).toBeTrue();
    expect(opties.scales.y.min).toBe(0);
    expect(opties.plugins.legend.position).toBe('right');
  });

  it('fout bij het ophalen: melding voor de gebruiker, geen grafiekdata', () => {
    spyOn(console, 'error');
    reporting.getLeanStartupData.and.returnValue(throwError('Gimmi API returned code 500'));
    toon();
    expect(notifications.showNotification).toHaveBeenCalledWith(
      'De leanstartupgegevens konden niet opgehaald worden.', 'error', 'Probleem met data ophaling');
    expect(fixture.componentInstance.lineChartData).toBeUndefined();
  });
});
