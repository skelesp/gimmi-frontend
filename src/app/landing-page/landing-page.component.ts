import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { LandingPageBannerComponent } from './landing-page-banner/landing-page-banner.component';
import { HowToUseComponent } from './how-to-use/how-to-use.component';

@Component({
    selector: 'gimmi-landing-page',
    templateUrl: './landing-page.component.html',
    styleUrls: ['./landing-page.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [LandingPageBannerComponent, HowToUseComponent]
})
export class LandingPageComponent implements OnInit {
  constructor() { }

  ngOnInit(): void {
  }

}
