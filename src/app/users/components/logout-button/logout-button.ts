import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { UserService } from '../../service/user.service';
import { User } from '../../models/user.model';
import { NgbDropdownItem } from '@ng-bootstrap/ng-bootstrap/dropdown';
import { CursorPointer } from '../../../shared/directives/cursor-pointer';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'gimmi-logout-button',
    templateUrl: './logout-button.html',
    styleUrls: ['./logout-button.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgbDropdownItem, CursorPointer, FaIconComponent]
})
export class LogoutButton {
  private userService = inject(UserService);

  readonly currentUser = input<User>(undefined);
  logoutIcon = faSignOutAlt;

  logout(): void {
    this.userService.logout("USER_EVENT");
  }

}
