import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { faEllipsisV } from "@fortawesome/free-solid-svg-icons";
import { ActionListItemConfig, ActionListItemComponent } from './action-list-item/action-list-item.component';
import { NgbDropdown, NgbDropdownToggle, NgbDropdownMenu } from '@ng-bootstrap/ng-bootstrap/dropdown';
import { CursorPointerDirective } from '../../../../shared/directives/cursor-pointer.directive';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';


@Component({
    selector: 'gimmi-action-list',
    templateUrl: './action-list.component.html',
    styleUrls: ['./action-list.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgbDropdown, CursorPointerDirective, NgbDropdownToggle, FaIconComponent, NgbDropdownMenu, ActionListItemComponent]
})
export class ActionListComponent {
  @Input() actionListItems : ActionListItemConfig[];
  actionListIcon = faEllipsisV;
}
