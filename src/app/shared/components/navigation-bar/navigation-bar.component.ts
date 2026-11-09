import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [BrandLogoComponent, PeopleSearchComponent, CursorPointerDirective, UserMenuComponent, NgbCollapse, UnknownUserMenuComponent]
})
export class NavigationBarComponent {
  private userService = inject(UserService);

  public isNavbarCollapsed = true;

  readonly currentUser = toSignal(this.userService.currentUser$);

  toggleNavbarCollapseState () {
    this.isNavbarCollapsed = !this.isNavbarCollapsed;
  }
}
