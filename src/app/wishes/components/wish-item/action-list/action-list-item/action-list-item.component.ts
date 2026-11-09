import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";

import { CursorPointerDirective } from '../../../../../shared/directives/cursor-pointer.directive';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

export interface ActionListItemConfig {
  text: string;
  icon: IconDefinition;
  onClick?: () => void;
  url?: string;
}

@Component({
    selector: 'gimmi-action-list-item',
    templateUrl: './action-list-item.component.html',
    styleUrls: ['./action-list-item.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointerDirective, FaIconComponent]
})
export class ActionListItemComponent {
  @Input() itemConfig: ActionListItemConfig;
}
