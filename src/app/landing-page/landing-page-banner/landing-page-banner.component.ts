import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { UserService } from '../../users/service/user.service';
import { Subscription } from 'rxjs';
import { User } from 'src/app/users/models/user.model';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { RouterLink } from '@angular/router';
import { CursorPointerDirective } from '../../shared/directives/cursor-pointer.directive';


@Component({
    selector: 'gimmi-landing-page-banner',
    templateUrl: './landing-page-banner.component.html',
    styleUrls: ['./landing-page-banner.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [FaIconComponent, RouterLink, CursorPointerDirective]
})
export class LandingPageBannerComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);

  checkIcon = faCheckCircle;
  currentUser: User;
  currentUserSubscription: Subscription;

  ngOnInit(): void {
    this.currentUserSubscription = this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    this.currentUserSubscription.unsubscribe();
  }
}
