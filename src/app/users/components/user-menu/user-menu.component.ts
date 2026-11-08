import { Component, OnInit, OnDestroy, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { UserService } from 'src/app/users/service/user.service';
import { Subscription } from 'rxjs';
import { faUserCircle } from "@fortawesome/free-solid-svg-icons";
import { User } from '../../models/user.model';
import { NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem } from '@ng-bootstrap/ng-bootstrap/dropdown';
import { CursorPointerDirective } from '../../../shared/directives/cursor-pointer.directive';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { RouterLink } from '@angular/router';
import { LogoutButtonComponent } from '../logout-button/logout-button.component';

@Component({
    selector: 'gimmi-user-menu',
    templateUrl: './user-menu.component.html',
    styleUrls: ['./user-menu.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgbDropdown, CursorPointerDirective, NgbDropdownToggle, FaIconComponent, NgbDropdownMenu, NgbDropdownItem, RouterLink, LogoutButtonComponent]
})
export class UserMenuComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);

  @Input() currentUser: User;
  currentUserSubscription: Subscription;

  userIcon = faUserCircle;

  ngOnInit(): void {
    this.currentUserSubscription = this.userService.currentUser$.subscribe( user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    this.currentUserSubscription.unsubscribe();
  }

}
