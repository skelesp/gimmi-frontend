import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalsClosedGuard  {

  constructor ( private modalController: NgbModal) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    if (this.modalController.hasOpenModals() ) {
      this.modalController.dismissAll("Close on navigation");
      console.info("[ModalsCloseGuard] Navigation cancelled because of open modal (which is closed now).");
      return false;
    }

    return true;
  }
  
}
