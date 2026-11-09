import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserService } from 'src/app/users/service/user.service';
import { faUserCircle } from "@fortawesome/free-solid-svg-icons";
import { NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem } from '@ng-bootstrap/ng-bootstrap/dropdown';
import { CursorPointer } from '../../../shared/directives/cursor-pointer';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { RouterLink } from '@angular/router';
import { LogoutButton } from '../logout-button/logout-button';

@Component({
    selector: 'gimmi-user-menu',
    templateUrl: './user-menu.html',
    styleUrls: ['./user-menu.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgbDropdown, CursorPointer, NgbDropdownToggle, FaIconComponent, NgbDropdownMenu, NgbDropdownItem, RouterLink, LogoutButton]
})
export class UserMenu {
  private userService = inject(UserService);

  readonly currentUser = toSignal(this.userService.currentUser$);

  userIcon = faUserCircle;

}
