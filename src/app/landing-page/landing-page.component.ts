import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'gimmi-landing-page',
    templateUrl: './landing-page.component.html',
    styleUrls: ['./landing-page.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class LandingPageComponent implements OnInit {
  constructor() { }

  ngOnInit(): void {
  }

}
