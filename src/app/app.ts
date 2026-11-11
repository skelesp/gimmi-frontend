import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationError, Router, RouterOutlet } from '@angular/router';
import { NavigationBar } from './shared/components/navigation-bar/navigation-bar';
import { ToastContainer } from './shared/components/toast-container/toast-container';
import { SocialButtons } from './shared/components/social-buttons/social-buttons';
import { PrivacyPolicy } from './shared/components/privacy-policy/privacy-policy';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'gimmi-root',
    templateUrl: './app.html',
    styleUrls: ['./app.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NavigationBar, ToastContainer, RouterOutlet, SocialButtons, PrivacyPolicy]
})
export class App implements OnInit {
  private titleService = inject(Title);
  private router = inject(Router);


  ngOnInit(): void {
    this.setTitle(environment.title);
    this.router.events.subscribe(event => {
      if (event instanceof NavigationError) {
        console.error(`Navigation to ${event.url} has encountered an error: ${event.error}`);
      }
    });
  }

  public setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle);
  }
}
