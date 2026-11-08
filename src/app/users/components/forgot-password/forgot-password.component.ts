import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { UserService } from '../../service/user.service';
import { NgIf } from '@angular/common';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { EmailInputComponent } from '../../../shared/components/form-components/email-input/email-input.component';

@Component({
    selector: 'gimmi-forgot-password',
    templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgIf, NgbAlert, FormsModule, ReactiveFormsModule, EmailInputComponent]
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm : UntypedFormGroup;
  successAlertClosed : boolean;
  requestSent  = false;
  
  constructor( 
    private userService : UserService,
    private notificationService : NotificationService
  ) { }

  ngOnInit(): void {
    this.forgotPasswordForm = new UntypedFormGroup ({});
  }

  public requestPasswordReset () : void {
    this.userService.requestPasswordReset(this.forgotPasswordForm.value.email).subscribe(() => {
      this.requestSent = true;
    }, error => {
      this.notificationService.showNotification(
        'Er ging iets fout bij het aanvragen van de wachtwoord reset. Gelieve opnieuw te proberen.',
        'warning'
      );
    });
  }

}
