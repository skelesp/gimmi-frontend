
import { TestBed } from '@angular/core/testing';
import { Toaster } from './toaster';

import { Notifications } from './notifications';

// sc-2000 (flash messages): type en titel van de toast.
describe('Notifications', () => {
    let service: Notifications;
    let toaster: Record<string, any>;

    beforeEach(() => {
        toaster = {
            open: vi.fn().mockName("Toaster.open")
        };
        TestBed.configureTestingModule({ providers: [{ provide: Toaster, useValue: toaster }] });
        service = TestBed.inject(Notifications);
    });

    function laatsteToast() {
        return vi.mocked(toaster.open).mock.lastCall[0] as any;
    }

    it('success: type success, titel "Gelukt!!"', () => {
        service.showNotification('ok', 'success');
        expect(laatsteToast()).toEqual({ text: 'ok', caption: 'Gelukt!!', type: 'success' });
    });

    it('error: type danger, titel "Foutmelding"', () => {
        service.showNotification('mis', 'error');
        expect(laatsteToast()).toEqual({ text: 'mis', caption: 'Foutmelding', type: 'danger' });
    });

    it('info en warning: eigen titels', () => {
        service.showNotification('a', 'info');
        expect(laatsteToast().caption).toBe('Info');
        service.showNotification('b', 'warning');
        expect(laatsteToast().caption).toBe('Waarschuwing');
        expect(laatsteToast().type).toBe('warning');
    });

    it('een meegegeven titel gaat voor', () => {
        service.showNotification('x', 'success', 'Welkom');
        expect(laatsteToast().caption).toBe('Welkom');
    });
});
