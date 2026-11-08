import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { InvitePersonData, PeopleService } from '../../service/people.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { EmailInputComponent } from '../../../shared/components/form-components/email-input/email-input.component';

@Component({
    selector: 'gimmi-invite',
    templateUrl: './invite.component.html',
    styleUrls: ['./invite.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [FormsModule, ReactiveFormsModule, FaIconComponent, EmailInputComponent]
})
export class InviteComponent implements OnInit {
  mailIcon = faEnvelope;
  invitationForm: UntypedFormGroup;

  constructor(private _peopleService: PeopleService) { }

  ngOnInit(): void {
    this.invitationForm = new UntypedFormGroup({
      'invitationData': new UntypedFormGroup({
        'notifyOnRegistration': new UntypedFormControl(false)
      })
    });
  }

  invitePerson() {
    const inviteInfo: InvitePersonData = {
      email: this.invitationForm.value.invitationData.emailaddress,
      notifyOnRegistration: this.invitationForm.value.invitationData.notifyOnRegistration
    }
    this._peopleService.invite(inviteInfo);    
    this.invitationForm.reset();
  }
}
