import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash, faUnlockAlt } from '@fortawesome/free-solid-svg-icons';

let nextId = 0;

/** A password input with a show/hide button for a Signal Form: `<gimmi-password-field [field]="form.password" />`. */
@Component({
  selector: 'gimmi-password-field',
  templateUrl: './password-field.html',
  styleUrl: './password-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, FaIconComponent]
})
export class PasswordField {
  readonly field = input.required<FieldTree<string>>();
  readonly label = input<string>();
  readonly placeholder = input('Wachtwoord');
  /** Links the label to the input; generated, unless the parent needs a fixed id. */
  readonly inputId = input(`password-field-${nextId++}`);

  protected readonly showPassword = signal(false);
  protected readonly passwordIcon = faUnlockAlt;
  protected readonly eyeIcon = faEye;
  protected readonly eyeSlashIcon = faEyeSlash;

  protected toggleShowPassword(): void {
    this.showPassword.update(shown => !shown);
  }
}
