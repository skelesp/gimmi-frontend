import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'gimmi-privacy-policy',
    templateUrl: './privacy-policy.html',
    styleUrls: ['./privacy-policy.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrivacyPolicy implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
