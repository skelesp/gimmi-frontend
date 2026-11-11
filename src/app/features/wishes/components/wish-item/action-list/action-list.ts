import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { faEllipsisV } from "@fortawesome/free-solid-svg-icons";
import { ActionListItemConfig, ActionListItem } from './action-list-item/action-list-item';
import { NgbDropdown, NgbDropdownToggle, NgbDropdownMenu } from '@ng-bootstrap/ng-bootstrap/dropdown';
import { CursorPointer } from '../../../../../shared/directives/cursor-pointer';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';


@Component({
    selector: 'gimmi-action-list',
    templateUrl: './action-list.html',
    styleUrls: ['./action-list.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgbDropdown, CursorPointer, NgbDropdownToggle, FaIconComponent, NgbDropdownMenu, ActionListItem]
})
export class ActionList {
  readonly actionListItems = input<ActionListItemConfig[]>(undefined);
  actionListIcon = faEllipsisV;
}
