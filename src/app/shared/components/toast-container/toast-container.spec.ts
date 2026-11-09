import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomToast } from '../custom-toast/custom-toast';
import { Toaster } from '../../services/toaster.service';
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

    it('toont een geopende toast en sluit hem met het kruisje', async () => {
        toaster.open({ text: 'ok', caption: 'Gelukt!!', type: 'success' });
        await fixture.whenStable();
        expect(fixture.nativeElement.querySelectorAll('.custom-toast').length).toBe(1);
        fixture.nativeElement.querySelector('button.btn-close').click();
        await fixture.whenStable();
        expect(fixture.nativeElement.querySelectorAll('.custom-toast').length).toBe(0);
    });

    it('sluit de toast vanzelf na vier seconden', async () => {
        toaster.open({ text: 'ok', caption: 'Info', type: 'info' });
        expect(toaster.toasts().length).toBe(1);
        await vi.advanceTimersByTimeAsync(Toaster.duration);
        expect(toaster.toasts().length).toBe(0);
    });
});
