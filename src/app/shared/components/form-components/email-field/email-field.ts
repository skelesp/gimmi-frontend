import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faAt } from '@fortawesome/free-solid-svg-icons';

let nextId = 0;

/** An e-mail input for a Signal Form: `<gimmi-email-field [field]="form.email" />`. Shows the messages of the field's errors. */
@Component({
  selector: 'gimmi-email-field',
  templateUrl: './email-field.html',
  styleUrl: './email-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, FaIconComponent]
})
export class EmailField {
  readonly field = input.required<FieldTree<string>>();
  readonly label = input<string>();
  readonly placeholder = input('Email (login)');
  /** Links the label to the input; generated, unless the parent needs a fixed id. */
  readonly inputId = input(`email-field-${nextId++}`);

  protected readonly mailIcon = faAt;
}
