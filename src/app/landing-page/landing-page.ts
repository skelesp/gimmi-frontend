import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { LandingPageBanner } from './landing-page-banner/landing-page-banner';
import { HowToUse } from './how-to-use/how-to-use';

@Component({
    selector: 'gimmi-landing-page',
    templateUrl: './landing-page.html',
    styleUrls: ['./landing-page.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LandingPageBanner, HowToUse]
})
export class LandingPage implements OnInit {
  constructor() { }

  ngOnInit(): void {
  }

}
