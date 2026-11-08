import { Component, Input } from '@angular/core';
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";

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
    standalone: false
})
export class ActionListItemComponent {
  @Input() itemConfig: ActionListItemConfig;
}
