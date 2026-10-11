import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Toast } from 'ngx-toast-notifications';

import { CustomToastComponent } from './custom-toast.component';

// Notificatiepopup (sc-2000), ook met tekst over meerdere regels (sc-2187).
describe('CustomToastComponent', () => {
  let fixture: ComponentFixture<CustomToastComponent>;
  let toast: jasmine.SpyObj<Toast> & { text: string; caption: string; type: string };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [CustomToastComponent] }).compileComponents();
    toast = Object.assign(jasmine.createSpyObj<Toast>('Toast', ['close']), {
      text: 'Je bent nu ingelogd in Gimmi. <br> Veel plezier gewenst!',
      caption: 'Welkom Ria',
      type: 'success'
    });
    fixture = TestBed.createComponent(CustomToastComponent);
    fixture.componentInstance.toast = toast;
    fixture.detectChanges();
  });

  it('toont titel en tekst, met de kleur van het type', () => {
    expect(fixture.nativeElement.querySelector('.toast-header strong').textContent).toBe('Welkom Ria');
    expect(fixture.nativeElement.querySelector('.custom-toast').classList).toContain('border-success');
  });

  it('tekst met <br> staat op meerdere regels', () => {
    const body: HTMLElement = fixture.nativeElement.querySelector('.toast-body div');
    expect(body.querySelectorAll('br').length).toBe(1);
    expect(body.textContent).toContain('Veel plezier gewenst!');
  });

  it('kruisje sluit de toast', () => {
    fixture.nativeElement.querySelector('button.close').click();
    expect(toast.close).toHaveBeenCalled();
  });
});
