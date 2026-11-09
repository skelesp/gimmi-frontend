import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormGroup } from '../../../shared/components/form-components/dynamic-form-group';
import { Person } from 'src/app/people/models/person.model';
import { PeopleService } from 'src/app/people/service/people.service';
import { INewUserRequestInfo } from '../../service/user.service';
import { AuthStore } from '../../../core/auth/auth-store';
import { UserService } from '../../service/user.service';

import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { CursorPointer } from '../../../shared/directives/cursor-pointer';
import { RouterLink } from '@angular/router';
import { ForgotPasswordLink } from '../forgot-password-link/forgot-password-link';
import { EmailInput } from '../../../shared/components/form-components/email-input/email-input';
import { PasswordCheck } from '../../../shared/components/form-components/password-check/password-check';

@Component({
    selector: 'gimmi-register',
    templateUrl: './register.html',
    styleUrls: ['./register.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgbAlert, CursorPointer, RouterLink, ForgotPasswordLink, FormsModule, ReactiveFormsModule, EmailInput, PasswordCheck]
})
export class Register implements OnInit {
  private userService = inject(UserService);
  private auth = inject(AuthStore);
  private peopleService = inject(PeopleService);

  invitedFor: string;
  readonly knownUser = signal(false);
  registrationForm: FormGroup<{
    personData: FormGroup<{
      firstName: FormControl<string | null>;
      lastName: FormControl<string | null>;
      birthday: FormControl<string | null>;
    }>;
    localAccountData: DynamicFormGroup;
  }>;
  infoAlertClosed: boolean;

  ngOnInit(): void {
    this.invitedFor = null; // Wordt pas geïmplementeerd als wishlist geïmplementeerd worden.
    this.registrationForm = new FormGroup({
      'personData': new FormGroup({
        'firstName': new FormControl<string | null>(null, Validators.required),
        'lastName': new FormControl<string | null>(null, Validators.required),
        'birthday': new FormControl<string | null>(null, Validators.required)
      }),
      'localAccountData': new FormGroup({})
    });
  }

  register () {
    const newUser : INewUserRequestInfo = {
      firstname: this.registrationForm.value.personData.firstName,
      lastname: this.registrationForm.value.personData.lastName,
      birthday: this.registrationForm.value.personData.birthday,
      email: this.registrationForm.value.localAccountData.email,
      password: this.registrationForm.value.localAccountData.passwordGroup.password
    };
    this.userService.register( newUser).subscribe(
      user => {
        // Form handling
        this.registrationForm.reset();

        this.auth.showAuthenticationConfirmation();
        this.auth.redirectAfterAuthentication();
        this.peopleService.addPerson(new Person(user.id, user.firstName, user.lastName))
      },
      error => {
        if (error.indexOf('User already exists') !== -1) {
          this.knownUser.set(true);
        }
        console.error(error);
      }
    );
  }

}
