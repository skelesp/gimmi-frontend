import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { UserService } from '../../users/service/user.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { RouterLink } from '@angular/router';
import { CursorPointer } from '../../shared/directives/cursor-pointer';


@Component({
    selector: 'gimmi-landing-page-banner',
    templateUrl: './landing-page-banner.html',
    styleUrls: ['./landing-page-banner.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FaIconComponent, RouterLink, CursorPointer]
})
export class LandingPageBanner {
  private userService = inject(UserService);

  checkIcon = faCheckCircle;
  readonly currentUser = toSignal(this.userService.currentUser$);
}
