import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunicationService } from 'src/app/shared/services/communication.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { Person } from '../../../models/person.model';
import { MailToButtonComponent } from './mail-to-button.component';

// Uitnodigen per mail vanuit de deelpopup.
describe('MailToButtonComponent', () => {
    let fixture: ComponentFixture<MailToButtonComponent>;
    let communication: Record<string, any>;

    beforeEach(async () => {
        communication = { sendMail: vi.fn() };
        await TestBed.configureTestingModule({
            imports: [MailToButtonComponent],
            providers: [
                { provide: CommunicationService, useValue: communication },
                { provide: NotificationService, useValue: { showNotification: vi.fn() } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(MailToButtonComponent);
        fixture.componentInstance.url = 'https://www.gimmi.be/people/ria';
        fixture.componentInstance.person = new Person('ria', 'Ria', 'Receiver');
        await fixture.whenStable();
    });

    it('de mailvelden zijn standaard verborgen en komen tevoorschijn na een klik', () => {
        expect(fixture.componentInstance.hideMailInfo).toBe(true);
        (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
        expect(fixture.componentInstance.hideMailInfo).toBe(false);
    });

    it('verstuurt per emailadres een uitnodiging met de link en het adres', () => {
        fixture.componentInstance.hideMailInfo = false;
        fixture.componentInstance.mailAddresses = 'a@gimmi.be,b@gimmi.be';
        fixture.componentInstance.send();
        expect(fixture.componentInstance.hideMailInfo).toBe(true);
        expect(communication.sendMail).toHaveBeenCalledTimes(2);
        const mail = communication.sendMail.mock.calls[0][0];
        expect(mail.to).toBe('a@gimmi.be');
        expect(mail.subject).toBe('[GIMMI] Ria Receiver nodigt je uit.');
        expect(mail.html).toContain('https://www.gimmi.be/people/ria?e=a%40gimmi.be');
        expect(communication.sendMail.mock.calls[1][0].to).toBe('b@gimmi.be');
    });
});
