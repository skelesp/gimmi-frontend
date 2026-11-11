import { NgOptimizedImage } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { AuthStore } from 'src/app/core/auth/auth-store';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { RouterLink } from '@angular/router';
import { CursorPointer } from '../../shared/directives/cursor-pointer';


@Component({
    selector: 'gimmi-landing-page-banner',
    templateUrl: './landing-page-banner.html',
    styleUrls: ['./landing-page-banner.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FaIconComponent, RouterLink, CursorPointer, NgOptimizedImage]
})
export class LandingPageBanner {
  private auth = inject(AuthStore);

  checkIcon = faCheckCircle;
  readonly currentUser = this.auth.user;
}
