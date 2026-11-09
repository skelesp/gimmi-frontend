import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
  private _peopleService = inject(PeopleService);

  mailIcon = faEnvelope;
  invitationForm: FormGroup<{
    invitationData: FormGroup<Record<string, AbstractControl>>;
  }>;

  ngOnInit(): void {
    this.invitationForm = new FormGroup({
      'invitationData': new FormGroup<Record<string, AbstractControl>>({
        'notifyOnRegistration': new FormControl(false, { nonNullable: true })
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
