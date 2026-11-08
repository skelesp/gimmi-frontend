import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { faUnlockAlt, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { NgIf } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CursorPointerDirective } from '../../../directives/cursor-pointer.directive';

const resolvedPromise = Promise.resolve(null);
@Component({
    selector: 'gimmi-password-input',
    templateUrl: './password-input.component.html',
    styleUrls: ['./password-input.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [FormsModule, ReactiveFormsModule, NgIf, FaIconComponent, CursorPointerDirective]
})
export class PasswordInputComponent implements OnInit {
  @Input() parentFormGroup : UntypedFormGroup;
  @Input() controlName  = 'password';
  @Input() placeholder  = 'Wachtwoord';
  @Input() label : string = null;
  
  showPassword = false;
  passwordIcon = faUnlockAlt;
  showPasswordIcon = faEye;

  constructor() { }

  ngOnInit(): void {
    this.parentFormGroup.addControl(this.controlName, new UntypedFormControl(null));
    /* Add validators asynchronously to controls to prevent ExpressionChangedAfterItHasBeenCheckedError 
    Source: https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
    */
    resolvedPromise.then( () => {
      this.parentFormGroup.get(this.controlName).setValidators(Validators.required)
      this.parentFormGroup.get(this.controlName).updateValueAndValidity();
    });
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
    this.showPasswordIcon = this.showPassword ? faEyeSlash : faEye;
  }
}
