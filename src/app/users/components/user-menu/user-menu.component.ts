import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserService } from 'src/app/users/service/user.service';
import { faUserCircle } from "@fortawesome/free-solid-svg-icons";
import { NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem } from '@ng-bootstrap/ng-bootstrap/dropdown';
import { CursorPointerDirective } from '../../../shared/directives/cursor-pointer.directive';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { RouterLink } from '@angular/router';
import { LogoutButtonComponent } from '../logout-button/logout-button.component';

@Component({
    selector: 'gimmi-user-menu',
    templateUrl: './user-menu.component.html',
    styleUrls: ['./user-menu.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgbDropdown, CursorPointerDirective, NgbDropdownToggle, FaIconComponent, NgbDropdownMenu, NgbDropdownItem, RouterLink, LogoutButtonComponent]
})
export class UserMenuComponent {
  private userService = inject(UserService);

  readonly currentUser = toSignal(this.userService.currentUser$);

  userIcon = faUserCircle;

}
