import type { Mock } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Notifications } from 'src/app/core/notifications';
import { CopyToClipboardButton } from './copy-to-clipboard-button';

// "Kopieer naar klembord" button in the share popup.
describe('CopyToClipboardButton', () => {
    let fixture: ComponentFixture<CopyToClipboardButton>;
    let notifications: Record<string, Mock>;

    beforeEach(async () => {
        notifications = { showNotification: vi.fn() };
        await TestBed.configureTestingModule({
            imports: [CopyToClipboardButton],
            providers: [{ provide: Notifications, useValue: notifications }]
        }).compileComponents();
        fixture = TestBed.createComponent(CopyToClipboardButton);
        fixture.componentInstance.url = 'https://www.gimmi.be/people/ria';
        await fixture.whenStable();
    });

    it('shows the button', () => {
        expect(fixture.nativeElement.querySelector('button').textContent).toContain('Kopieer naar klembord');
    });

    it('reports a successful copy', () => {
        fixture.componentInstance.handleSuccess();
        expect(notifications.showNotification).toHaveBeenCalledWith(expect.stringContaining('gekopieerd'), 'success', 'Link gekopieerd');
    });

    it('reports a failed copy', () => {
        fixture.componentInstance.handleError();
        expect(notifications.showNotification).toHaveBeenCalledWith(expect.stringContaining('niet gekopieerd'), 'error', 'Link niet gekopieerd');
    });
});
