import type { Mock } from 'vitest';

import { TestBed } from '@angular/core/testing';
import { Toaster } from './toaster';

import { Notifications } from './notifications';

// sc-2000 (flash messages): type and title of the toast.
describe('Notifications', () => {
    let service: Notifications;
    let toaster: Record<string, Mock>;

    beforeEach(() => {
        toaster = {
            open: vi.fn().mockName("Toaster.open")
        };
        TestBed.configureTestingModule({ providers: [{ provide: Toaster, useValue: toaster }] });
        service = TestBed.inject(Notifications);
    });

    function lastToast() {
        return vi.mocked(toaster.open).mock.lastCall[0] as { type: string; caption: string; text: string };
    }

    it('success: type success, titel "Gelukt!!"', () => {
        service.showNotification('ok', 'success');
        expect(lastToast()).toEqual({ text: 'ok', caption: 'Gelukt!!', type: 'success' });
    });

    it('error: type danger, titel "Foutmelding"', () => {
        service.showNotification('mis', 'error');
        expect(lastToast()).toEqual({ text: 'mis', caption: 'Foutmelding', type: 'danger' });
    });

    it('info and warning: own titles', () => {
        service.showNotification('a', 'info');
        expect(lastToast().caption).toBe('Info');
        service.showNotification('b', 'warning');
        expect(lastToast().caption).toBe('Waarschuwing');
        expect(lastToast().type).toBe('warning');
    });

    it('a given title takes precedence', () => {
        service.showNotification('x', 'success', 'Welkom');
        expect(lastToast().caption).toBe('Welkom');
    });
});
