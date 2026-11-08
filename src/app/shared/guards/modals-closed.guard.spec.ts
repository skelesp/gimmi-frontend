
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ModalsClosedGuard } from './modals-closed.guard';

// Navigeren terwijl er een modal open staat sluit eerst de modal (sc-2693).
describe('ModalsClosedGuard', () => {
    let guard: ModalsClosedGuard;
    let modal: Record<string, any>;
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    beforeEach(() => {
        modal = {
            hasOpenModals: vi.fn().mockName("NgbModal.hasOpenModals"),
            dismissAll: vi.fn().mockName("NgbModal.dismissAll")
        };
        TestBed.configureTestingModule({ providers: [{ provide: NgbModal, useValue: modal }] });
        guard = TestBed.inject(ModalsClosedGuard);
    });

    it('zonder open modal: navigatie gaat door', () => {
        modal.hasOpenModals.mockReturnValue(false);
        expect(guard.canActivate(route, state)).toBe(true);
        expect(modal.dismissAll).not.toHaveBeenCalled();
    });

    it('met een open modal: modal sluit en de navigatie wordt geannuleerd', () => {
        modal.hasOpenModals.mockReturnValue(true);
        vi.spyOn(console, 'info').mockReturnValue(undefined);
        expect(guard.canActivate(route, state)).toBe(false);
        expect(modal.dismissAll).toHaveBeenCalledWith('Close on navigation');
    });
});
