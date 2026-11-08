import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { UserService } from 'src/app/users/service/user.service';
import { Subscription } from 'rxjs';
import { faUserCircle } from "@fortawesome/free-solid-svg-icons";
import { User } from '../../models/user.model';

@Component({
    selector: 'gimmi-user-menu',
    templateUrl: './user-menu.component.html',
    styleUrls: ['./user-menu.component.css'],
    standalone: false
})
export class UserMenuComponent implements OnInit, OnDestroy {
  @Input() currentUser: User;
  currentUserSubscription: Subscription;

  userIcon = faUserCircle;

  constructor( 
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.currentUserSubscription = this.userService.currentUser$.subscribe( user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    this.currentUserSubscription.unsubscribe();
  }

}
