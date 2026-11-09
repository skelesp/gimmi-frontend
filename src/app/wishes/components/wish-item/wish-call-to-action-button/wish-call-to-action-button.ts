import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { CursorPointer } from '../../../../shared/directives/cursor-pointer';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

export interface CTAButtonConfig {
  text: string;
  icon: IconDefinition;
  onClick?: () => void;
}
@Component({
    selector: 'gimmi-wish-call-to-action-button',
    templateUrl: './wish-call-to-action-button.html',
    styleUrls: ['./wish-call-to-action-button.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointer, FaIconComponent]
})
export class WishCallToActionButton {
  @Input() CTAconfig : CTAButtonConfig;

}
