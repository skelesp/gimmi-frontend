import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ModalsClosedGuard } from './modals-closed.guard';

// Navigeren terwijl er een modal open staat sluit eerst de modal (sc-2693).
describe('ModalsClosedGuard', () => {
  let guard: ModalsClosedGuard;
  let modal: jasmine.SpyObj<NgbModal>;
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;

  beforeEach(() => {
    modal = jasmine.createSpyObj<NgbModal>('NgbModal', ['hasOpenModals', 'dismissAll']);
    TestBed.configureTestingModule({ providers: [{ provide: NgbModal, useValue: modal }] });
    guard = TestBed.inject(ModalsClosedGuard);
  });

  it('zonder open modal: navigatie gaat door', () => {
    modal.hasOpenModals.and.returnValue(false);
    expect(guard.canActivate(route, state)).toBeTrue();
    expect(modal.dismissAll).not.toHaveBeenCalled();
  });

  it('met een open modal: modal sluit en de navigatie wordt geannuleerd', () => {
    modal.hasOpenModals.and.returnValue(true);
    spyOn(console, 'info');
    expect(guard.canActivate(route, state)).toBeFalse();
    expect(modal.dismissAll).toHaveBeenCalledWith('Close on navigation');
  });
});
