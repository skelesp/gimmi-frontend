import { Component, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from 'src/app/users/models/user.model';
import { UserService } from 'src/app/users/service/user.service';

@Component({
    selector: 'gimmi-navigation-bar',
    templateUrl: './navigation-bar.component.html',
    styleUrls: ['./navigation-bar.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
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
