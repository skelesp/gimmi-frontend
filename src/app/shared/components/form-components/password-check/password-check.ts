import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormGroup } from '../dynamic-form-group';
import { PasswordInput } from '../password-input/password-input';


@Component({
    selector: 'gimmi-password-check',
    templateUrl: './password-check.html',
    styleUrls: ['./password-check.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, ReactiveFormsModule, PasswordInput]
})
export class PasswordCheck implements OnInit {
  @Input() parentFormGroup : DynamicFormGroup;
  @Input() controlName  = 'passwordGroup';

  get passwordGroup(): DynamicFormGroup {
    return this.parentFormGroup.get(this.controlName) as DynamicFormGroup;
  }

  constructor() { }

  ngOnInit(): void {
    this.parentFormGroup.addControl(this.controlName, new FormGroup({}, {
      validators: this.passwordMatchValidator
    }));
  }

   passwordMatchValidator : ValidatorFn = (control : AbstractControl) : ValidationErrors | null => {
    const password = control.get('password');
    const passwordCheck = control.get('passwordCheck');

    return password?.value && passwordCheck?.value && password.value !== passwordCheck.value ? { noPasswordMatch : true } : null;
  }

}
