import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { faTwitterSquare, faFacebookSquare, faLinkedin } from "@fortawesome/free-brands-svg-icons";

@Component({
    selector: 'gimmi-social-buttons',
    templateUrl: './social-buttons.component.html',
    styleUrls: ['./social-buttons.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SocialButtonsComponent implements OnInit {
  facebookIcon = faFacebookSquare;
  twitterIcon = faTwitterSquare;
  linkedInIcon = faLinkedin;

  constructor() { }

  ngOnInit(): void {
  }

}
