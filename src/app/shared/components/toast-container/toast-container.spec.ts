import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomToast } from '../custom-toast/custom-toast';
import { Toaster } from '../../../core/toaster';
import { ToastContainer } from './toast-container';

describe('ToastContainer', () => {
    beforeEach(() => {
        vi.useFakeTimers({ advanceTimeDelta: 1, shouldAdvanceTime: true });
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    let fixture: ComponentFixture<ToastContainer>;
    let toaster: Toaster;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
    imports: [ToastContainer, CustomToast]
}).compileComponents();
        toaster = TestBed.inject(Toaster);
        fixture = TestBed.createComponent(ToastContainer);
    });

    it('shows an opened toast and closes it with the cross', async () => {
        toaster.open({ text: 'ok', caption: 'Gelukt!!', type: 'success' });
        await fixture.whenStable();
        expect(fixture.nativeElement.querySelectorAll('.custom-toast').length).toBe(1);
        fixture.nativeElement.querySelector('button.btn-close').click();
        await fixture.whenStable();
        expect(fixture.nativeElement.querySelectorAll('.custom-toast').length).toBe(0);
    });

    it('closes the toast by itself after four seconds', async () => {
        toaster.open({ text: 'ok', caption: 'Info', type: 'info' });
        expect(toaster.toasts().length).toBe(1);
        await vi.advanceTimersByTimeAsync(Toaster.duration);
        expect(toaster.toasts().length).toBe(0);
    });
});
