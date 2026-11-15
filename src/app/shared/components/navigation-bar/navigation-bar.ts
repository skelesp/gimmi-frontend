import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { BrandLogo } from '../brand-logo/brand-logo';
import { PeopleSearch } from '../../../features/people/components/people-search/people-search';

import { CursorPointer } from '../../directives/cursor-pointer';
import { UserMenu } from '../../../features/users/components/user-menu/user-menu';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap/collapse';
import { UnknownUserMenu } from '../../../features/users/components/unknown-user-menu/unknown-user-menu';

@Component({
    selector: 'gimmi-navigation-bar',
    templateUrl: './navigation-bar.html',
    styleUrls: ['./navigation-bar.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [BrandLogo, PeopleSearch, CursorPointer, UserMenu, NgbCollapse, UnknownUserMenu]
})
export class NavigationBar {
  private auth = inject(AuthStore);

  public isNavbarCollapsed = true;

  readonly currentUser = this.auth.user;

  toggleNavbarCollapseState () {
    this.isNavbarCollapsed = !this.isNavbarCollapsed;
  }
}
