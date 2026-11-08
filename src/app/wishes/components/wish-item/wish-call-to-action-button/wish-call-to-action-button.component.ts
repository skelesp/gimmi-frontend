import { Component, Input } from '@angular/core';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface CTAButtonConfig {
  text: string;
  icon: IconDefinition;
  onClick?: () => void;
}
@Component({
    selector: 'gimmi-wish-call-to-action-button',
    templateUrl: './wish-call-to-action-button.component.html',
    styleUrls: ['./wish-call-to-action-button.component.css'],
    standalone: false
})
export class WishCallToActionButtonComponent {
  @Input() CTAconfig : CTAButtonConfig;

}
