import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationError, Router, RouterOutlet } from '@angular/router';
import { NavigationBarComponent } from './shared/components/navigation-bar/navigation-bar.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { SocialButtonsComponent } from './shared/components/social-buttons/social-buttons.component';
import { PrivacyPolicyComponent } from './shared/components/privacy-policy/privacy-policy.component';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'gimmi-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NavigationBarComponent, ToastContainerComponent, RouterOutlet, SocialButtonsComponent, PrivacyPolicyComponent]
})
export class AppComponent implements OnInit {
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
