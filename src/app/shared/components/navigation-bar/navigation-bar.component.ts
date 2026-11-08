import { Component, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from 'src/app/users/models/user.model';
import { UserService } from 'src/app/users/service/user.service';
import { BrandLogoComponent } from '../brand-logo/brand-logo.component';
import { PeopleSearchComponent } from '../../../people/components/people-search/people-search.component';

import { CursorPointerDirective } from '../../directives/cursor-pointer.directive';
import { UserMenuComponent } from '../../../users/components/user-menu/user-menu.component';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap/collapse';
import { UnknownUserMenuComponent } from '../../../users/components/unknown-user-menu/unknown-user-menu.component';

@Component({
    selector: 'gimmi-navigation-bar',
    templateUrl: './navigation-bar.component.html',
    styleUrls: ['./navigation-bar.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [BrandLogoComponent, PeopleSearchComponent, CursorPointerDirective, UserMenuComponent, NgbCollapse, UnknownUserMenuComponent]
})
export class NavigationBarComponent implements OnInit, OnDestroy {
  public isNavbarCollapsed = true;

  currentUser: User;
  currentUserSubscription: Subscription;

  constructor( private userService: UserService) {}

  toggleNavbarCollapseState () {
    this.isNavbarCollapsed = !this.isNavbarCollapsed;
  }

  ngOnInit(): void {
    this.currentUserSubscription = this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    })
  }
  ngOnDestroy(): void {
    this.currentUserSubscription.unsubscribe();
  }
}
