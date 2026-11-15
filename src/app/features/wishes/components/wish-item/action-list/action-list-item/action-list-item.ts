import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";

import { CursorPointer } from '../../../../../../shared/directives/cursor-pointer';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

export interface ActionListItemConfig {
  text: string;
  icon: IconDefinition;
  onClick?: () => void;
  url?: string;
}

@Component({
    selector: 'gimmi-action-list-item',
    templateUrl: './action-list-item.html',
    styleUrls: ['./action-list-item.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointer, FaIconComponent]
})
export class ActionListItem {
  @Input() itemConfig: ActionListItemConfig;
}
