import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeviceDetectorService } from 'ngx-device-detector';

import { WhatsappButtonComponent } from './whatsapp-button.component';

describe('WhatsappButtonComponent', () => {
  let component: WhatsappButtonComponent;
  let fixture: ComponentFixture<WhatsappButtonComponent>;
  let device: Record<string, any>;

  function url(): string {
    return String((component.generateUrl() as any).changingThisBreaksApplicationSecurity);
  }

  beforeEach(async () => {
    device = { isMobile: vi.fn().mockReturnValue(false) };
    await TestBed.configureTestingModule({
    imports: [WhatsappButtonComponent],
    providers: [{ provide: DeviceDetectorService, useValue: device }],
    schemas: [NO_ERRORS_SCHEMA]
})
    .compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(WhatsappButtonComponent);
    component = fixture.componentInstance;
    component.message = 'hallo';
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('desktop: link naar WhatsApp Web met het bericht', () => {
    expect(url()).toBe('https://web.whatsapp.com/send?text=hallo');
  });

  it('gsm: link naar de WhatsApp-app met het bericht', () => {
    device.isMobile.mockReturnValue(true);
    expect(url()).toBe('whatsapp://send?text=hallo');
  });
});
