import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationService } from 'src/app/shared/services/notification.service';
import { CopyToClipboardButton } from './copy-to-clipboard-button';

// Knop "Kopieer naar klembord" in de deelpopup.
describe('CopyToClipboardButton', () => {
    let fixture: ComponentFixture<CopyToClipboardButton>;
    let notifications: Record<string, any>;

    beforeEach(async () => {
        notifications = { showNotification: vi.fn() };
        await TestBed.configureTestingModule({
            imports: [CopyToClipboardButton],
            providers: [{ provide: NotificationService, useValue: notifications }]
        }).compileComponents();
        fixture = TestBed.createComponent(CopyToClipboardButton);
        fixture.componentInstance.url = 'https://www.gimmi.be/people/ria';
        await fixture.whenStable();
    });

    it('toont de knop', () => {
        expect(fixture.nativeElement.querySelector('button').textContent).toContain('Kopieer naar klembord');
    });

    it('meldt een geslaagde kopie', () => {
        fixture.componentInstance.handleSuccess();
        expect(notifications.showNotification).toHaveBeenCalledWith(expect.stringContaining('gekopieerd'), 'success', 'Link gekopieerd');
    });

    it('meldt een mislukte kopie', () => {
        fixture.componentInstance.handleError();
        expect(notifications.showNotification).toHaveBeenCalledWith(expect.stringContaining('niet gekopieerd'), 'error', 'Link niet gekopieerd');
    });
});
