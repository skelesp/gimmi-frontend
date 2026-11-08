import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { InvitePersonData, PeopleService } from '../../service/people.service';

@Component({
    selector: 'gimmi-invite',
    templateUrl: './invite.component.html',
    styleUrls: ['./invite.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
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
