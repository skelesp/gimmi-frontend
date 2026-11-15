import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { AuthStore } from '../../../../core/auth/auth-store';
import { NgbDropdownItem } from '@ng-bootstrap/ng-bootstrap/dropdown';
import { CursorPointer } from '../../../../shared/directives/cursor-pointer';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'gimmi-logout-button',
    templateUrl: './logout-button.html',
    styleUrls: ['./logout-button.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgbDropdownItem, CursorPointer, FaIconComponent]
})
export class LogoutButton {
  private auth = inject(AuthStore);

  logoutIcon = faSignOutAlt;

  logout(): void {
    this.auth.logout("USER_EVENT");
  }

}
