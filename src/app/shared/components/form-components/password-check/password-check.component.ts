import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormGroup, ValidationErrors, ValidatorFn, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PasswordInputComponent } from '../password-input/password-input.component';
import { NgIf } from '@angular/common';

@Component({
    selector: 'gimmi-password-check',
    templateUrl: './password-check.component.html',
    styleUrls: ['./password-check.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [FormsModule, ReactiveFormsModule, PasswordInputComponent, NgIf]
})
export class PasswordCheckComponent implements OnInit {
  @Input() parentFormGroup : UntypedFormGroup;
  @Input() controlName  = 'passwordGroup';

  constructor() { }

  ngOnInit(): void {
    this.parentFormGroup.addControl(this.controlName, new UntypedFormGroup({}, {
      validators: this.passwordMatchValidator
    }));
  }

   passwordMatchValidator : ValidatorFn = (control : UntypedFormGroup) : ValidationErrors | null => {
    const password = control.get('password');
    const passwordCheck = control.get('passwordCheck');

    return password?.value && passwordCheck?.value && password.value !== passwordCheck.value ? { noPasswordMatch : true } : null;
  }

}
