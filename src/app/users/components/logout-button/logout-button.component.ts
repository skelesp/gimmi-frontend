import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { UserService } from '../../service/user.service';
import { User } from '../../models/user.model';
import { NgbDropdownItem } from '@ng-bootstrap/ng-bootstrap/dropdown';
import { CursorPointerDirective } from '../../../shared/directives/cursor-pointer.directive';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'gimmi-logout-button',
    templateUrl: './logout-button.component.html',
    styleUrls: ['./logout-button.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgbDropdownItem, CursorPointerDirective, FaIconComponent]
})
export class LogoutButtonComponent {
  @Input() currentUser : User;
  logoutIcon = faSignOutAlt;

  constructor(
    private userService: UserService
  ) { }

  logout(): void {
    this.userService.logout("USER_EVENT");
  }

}
