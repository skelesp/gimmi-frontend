import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MailToButton } from './mail-to-button';

// Inviting by mail from the share popup: the visitor's mail app opens with the invitation filled in.
describe('MailToButton', () => {
    let fixture: ComponentFixture<MailToButton>;
    let open: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [MailToButton] }).compileComponents();
        fixture = TestBed.createComponent(MailToButton);
        fixture.componentInstance.url = 'https://www.gimmi.be/people/ria';
        fixture.componentInstance.person = { id: 'ria', firstName: 'Ria', lastName: 'Receiver' };
        open = vi.fn();
        (fixture.componentInstance as unknown as { open: typeof open }).open = open;
        await fixture.whenStable();
    });

    it('the mail fields are hidden by default and appear after a click', () => {
        expect(fixture.componentInstance.hideMailInfo).toBe(true);
        (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
        expect(fixture.componentInstance.hideMailInfo).toBe(false);
    });

    async function typeAddresses(addresses: string) {
        const field = fixture.nativeElement.querySelector('#mailAddresses') as HTMLTextAreaElement;
        field.value = addresses;
        field.dispatchEvent(new Event('input'));
        await fixture.whenStable();
    }

    it('opens the mail app with all addresses in bcc, the subject and the link', async () => {
        fixture.componentInstance.hideMailInfo = false;
        await typeAddresses('a@gimmi.be, b@gimmi.be');
        fixture.componentInstance.send();
        expect(fixture.componentInstance.hideMailInfo).toBe(true);
        expect(open).toHaveBeenCalledTimes(1);
        const mailto = new URL(open.mock.calls[0][0]);
        expect(mailto.protocol).toBe('mailto:');
        expect(mailto.searchParams.get('bcc')).toBe('a@gimmi.be,b@gimmi.be');
        expect(mailto.searchParams.get('subject')).toBe('[GIMMI] Ria Receiver nodigt je uit.');
        expect(mailto.searchParams.get('body')).toContain('https://www.gimmi.be/people/ria');
    });

    it('without an address nothing opens', async () => {
        fixture.componentInstance.send();
        await typeAddresses(' , ');
        fixture.componentInstance.send();
        expect(open).not.toHaveBeenCalled();
    });
});
