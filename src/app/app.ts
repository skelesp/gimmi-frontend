import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { NavigationError, Router, RouterLink, RouterOutlet } from '@angular/router';
import { NavigationBar } from './shared/components/navigation-bar/navigation-bar';
import { ToastContainer } from './shared/components/toast-container/toast-container';
import { SocialButtons } from './shared/components/social-buttons/social-buttons';

@Component({
    selector: 'gimmi-root',
    templateUrl: './app.html',
    styleUrls: ['./app.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NavigationBar, ToastContainer, RouterOutlet, SocialButtons, RouterLink]
})
export class App implements OnInit {
  private router = inject(Router);

  ngOnInit(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationError) {
        console.error(`Navigation to ${event.url} has encountered an error: ${event.error}`);
      }
    });
  }
}
