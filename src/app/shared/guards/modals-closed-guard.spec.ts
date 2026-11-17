import type { Mock } from 'vitest';

import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { modalsClosedGuard } from './modals-closed-guard';

// Navigating while a modal is open closes the modal first (sc-2693).
describe('modalsClosedGuard', () => {
    let modal: Record<string, Mock>;
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    beforeEach(() => {
        modal = {
            hasOpenModals: vi.fn().mockName("NgbModal.hasOpenModals"),
            dismissAll: vi.fn().mockName("NgbModal.dismissAll")
        };
        TestBed.configureTestingModule({ providers: [{ provide: NgbModal, useValue: modal }] });
    });

    function check() {
        return TestBed.runInInjectionContext(() => modalsClosedGuard(route, state));
    }

    it('without an open modal: navigation continues', () => {
        modal.hasOpenModals.mockReturnValue(false);
        expect(check()).toBe(true);
        expect(modal.dismissAll).not.toHaveBeenCalled();
    });

    it('with an open modal: the modal closes and the navigation is cancelled', () => {
        modal.hasOpenModals.mockReturnValue(true);
        vi.spyOn(console, 'info').mockReturnValue(undefined);
        expect(check()).toBe(false);
        expect(modal.dismissAll).toHaveBeenCalledWith('Close on navigation');
    });
});
