import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Person } from 'src/app/people/models/person.model';
import { PeopleService } from 'src/app/people/service/people.service';
import { INewUserRequestInfo } from '../../service/user.service';
import { UserService } from '../../service/user.service';

@Component({
    selector: 'gimmi-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class RegisterComponent implements OnInit {
  invitedFor: string;
  knownUser: boolean;
  registrationForm: UntypedFormGroup;
  infoAlertClosed: boolean;

  constructor( 
    private userService : UserService,
    private peopleService : PeopleService
  ) { }

  ngOnInit(): void {
    this.invitedFor = null; // Wordt pas geïmplementeerd als wishlist geïmplementeerd worden.
    this.registrationForm = new UntypedFormGroup ({
      'personData': new UntypedFormGroup({
        'firstName': new UntypedFormControl(null, Validators.required),
        'lastName': new UntypedFormControl(null, Validators.required),
        'birthday': new UntypedFormControl(null, Validators.required)
      }),
      'localAccountData': new UntypedFormGroup({})
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

        this.userService.showAuthenticationConfirmation();
        this.userService.redirectAfterAuthentication();
        this.peopleService.addPerson(new Person(user.id, user.firstName, user.lastName))
      },
      error => {
        if (error.indexOf('User already exists') !== -1) {
          this.knownUser = true;
        }
        console.error(error);
      }
    );
  }

}
