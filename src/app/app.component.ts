import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationError, Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'gimmi-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AppComponent implements OnInit {
  public constructor(
    private titleService: Title,
    private router: Router) { }

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
