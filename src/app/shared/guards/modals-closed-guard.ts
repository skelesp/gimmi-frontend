import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

export const modalsClosedGuard: CanActivateFn = () => {
  const modalController = inject(NgbModal);

  if (modalController.hasOpenModals() ) {
    modalController.dismissAll("Close on navigation");
    console.info("[ModalsCloseGuard] Navigation cancelled because of open modal (which is closed now).");
    return false;
  }

  return true;
};
