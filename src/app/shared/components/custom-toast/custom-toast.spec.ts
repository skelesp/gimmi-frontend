import type { Mock } from 'vitest';

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomToast } from './custom-toast';

// Notification popup (sc-2000), also with text over multiple lines (sc-2187).
describe('CustomToast', () => {
    let fixture: ComponentFixture<CustomToast>;
    let toast: { close: Mock; text: string; caption: string; type: string };

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [CustomToast] }).compileComponents();
        toast = Object.assign({
            close: vi.fn().mockName("Toast.close")
        }, {
            text: 'Je bent nu ingelogd in Gimmi. <br> Veel plezier gewenst!',
            caption: 'Welkom Ria',
            type: 'success'
        });
        fixture = TestBed.createComponent(CustomToast);
        fixture.componentInstance.toast = toast as unknown as typeof fixture.componentInstance.toast;
        await fixture.whenStable();
    });

    it('shows title and text, with the colour of the type', () => {
        expect(fixture.nativeElement.querySelector('.toast-header strong').textContent).toBe('Welkom Ria');
        expect(fixture.nativeElement.querySelector('.custom-toast').classList).toContain('border-success');
    });

    it('text with <br> is on multiple lines', () => {
        const body: HTMLElement = fixture.nativeElement.querySelector('.toast-body div');
        expect(body.querySelectorAll('br').length).toBe(1);
        expect(body.textContent).toContain('Veel plezier gewenst!');
    });

    it('cross closes the toast', () => {
        fixture.nativeElement.querySelector('button.btn-close').click();
        expect(toast.close).toHaveBeenCalled();
    });
});
