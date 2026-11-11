import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { faPlus, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { itemTypes, PreferenceRow } from '../extra-info';

@Component({
    selector: 'gimmi-extra-info-edit',
    templateUrl: './extra-info-edit.html',
    styleUrls: ['./extra-info-edit.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormField, FaIconComponent]
})
export class ExtraInfoEdit {
  readonly rows = input.required<FieldTree<PreferenceRow[]>>();
  readonly itemType = input<itemTypes>(undefined);

  protected readonly deleteIcon = faTrashAlt;
  protected readonly addIcon = faPlus;

  protected addRow() {
    this.rows()().value.update(rows => [...rows, { text: '', url: '' }]);
  }

  protected removeRow(index: number) {
    this.rows()().value.update(rows => rows.filter((_, i) => i !== index));
  }
}
