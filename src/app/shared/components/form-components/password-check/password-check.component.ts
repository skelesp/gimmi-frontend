import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

@Component({
    selector: 'gimmi-password-check',
    templateUrl: './password-check.component.html',
    styleUrls: ['./password-check.component.css'],
    standalone: false
})
export class PasswordCheckComponent implements OnInit {
  @Input() parentFormGroup : UntypedFormGroup;
  @Input() controlName : string = 'passwordGroup';

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
