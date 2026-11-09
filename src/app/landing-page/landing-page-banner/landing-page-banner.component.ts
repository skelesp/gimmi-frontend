import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { UserService } from '../../users/service/user.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { RouterLink } from '@angular/router';
import { CursorPointerDirective } from '../../shared/directives/cursor-pointer.directive';


@Component({
    selector: 'gimmi-landing-page-banner',
    templateUrl: './landing-page-banner.component.html',
    styleUrls: ['./landing-page-banner.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FaIconComponent, RouterLink, CursorPointerDirective]
})
export class LandingPageBannerComponent {
  private userService = inject(UserService);

  checkIcon = faCheckCircle;
  readonly currentUser = toSignal(this.userService.currentUser$);
}
