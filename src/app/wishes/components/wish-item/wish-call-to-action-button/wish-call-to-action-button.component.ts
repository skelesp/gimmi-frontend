import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { NgIf } from '@angular/common';
import { CursorPointerDirective } from '../../../../shared/directives/cursor-pointer.directive';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

export interface CTAButtonConfig {
  text: string;
  icon: IconDefinition;
  onClick?: () => void;
}
@Component({
    selector: 'gimmi-wish-call-to-action-button',
    templateUrl: './wish-call-to-action-button.component.html',
    styleUrls: ['./wish-call-to-action-button.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgIf, CursorPointerDirective, FaIconComponent]
})
export class WishCallToActionButtonComponent {
  @Input() CTAconfig : CTAButtonConfig;

}
