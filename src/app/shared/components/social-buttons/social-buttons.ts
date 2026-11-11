import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { faTwitterSquare, faFacebookSquare, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'gimmi-social-buttons',
    templateUrl: './social-buttons.html',
    styleUrls: ['./social-buttons.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FaIconComponent]
})
export class SocialButtons implements OnInit {
  facebookIcon = faFacebookSquare;
  twitterIcon = faTwitterSquare;
  linkedInIcon = faLinkedin;

  constructor() { }

  ngOnInit(): void {
  }

}
