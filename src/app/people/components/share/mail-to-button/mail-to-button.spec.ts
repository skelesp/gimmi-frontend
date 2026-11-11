import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Person } from '../../../models/person.model';
import { MailToButton } from './mail-to-button';

// Uitnodigen per mail vanuit de deelpopup: de mailapp van de bezoeker opent met de uitnodiging ingevuld.
describe('MailToButton', () => {
    let fixture: ComponentFixture<MailToButton>;
    let open: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [MailToButton] }).compileComponents();
        fixture = TestBed.createComponent(MailToButton);
        fixture.componentInstance.url = 'https://www.gimmi.be/people/ria';
        fixture.componentInstance.person = new Person('ria', 'Ria', 'Receiver');
        open = vi.fn();
        (fixture.componentInstance as unknown as { open: typeof open }).open = open;
        await fixture.whenStable();
    });

    it('de mailvelden zijn standaard verborgen en komen tevoorschijn na een klik', () => {
        expect(fixture.componentInstance.hideMailInfo).toBe(true);
        (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
        expect(fixture.componentInstance.hideMailInfo).toBe(false);
    });

    it('opent de mailapp met alle adressen in bcc, het onderwerp en de link', () => {
        fixture.componentInstance.hideMailInfo = false;
        fixture.componentInstance.mailAddresses = 'a@gimmi.be, b@gimmi.be';
        fixture.componentInstance.send();
        expect(fixture.componentInstance.hideMailInfo).toBe(true);
        expect(open).toHaveBeenCalledTimes(1);
        const mailto = new URL(open.mock.calls[0][0]);
        expect(mailto.protocol).toBe('mailto:');
        expect(mailto.searchParams.get('bcc')).toBe('a@gimmi.be,b@gimmi.be');
        expect(mailto.searchParams.get('subject')).toBe('[GIMMI] Ria Receiver nodigt je uit.');
        expect(mailto.searchParams.get('body')).toContain('https://www.gimmi.be/people/ria');
    });

    it('zonder adres opent er niets', () => {
        fixture.componentInstance.mailAddresses = ' , ';
        fixture.componentInstance.send();
        fixture.componentInstance.mailAddresses = undefined;
        fixture.componentInstance.send();
        expect(open).not.toHaveBeenCalled();
    });
});
