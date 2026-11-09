import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { DynamicFormGroup } from '../../../shared/components/form-components/dynamic-form-group';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { UserService } from '../../service/user.service';

import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { EmailInput } from '../../../shared/components/form-components/email-input/email-input';

@Component({
    selector: 'gimmi-forgot-password',
    templateUrl: './forgot-password.html',
    styleUrls: ['./forgot-password.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgbAlert, FormsModule, ReactiveFormsModule, EmailInput]
})
export class ForgotPassword implements OnInit {
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);

  forgotPasswordForm : DynamicFormGroup;
  successAlertClosed : boolean;
  readonly requestSent = signal(false);

  ngOnInit(): void {
    this.forgotPasswordForm = new FormGroup({});
  }

  public requestPasswordReset () : void {
    this.userService.requestPasswordReset(this.forgotPasswordForm.value.email).subscribe(() => {
      this.requestSent.set(true);
    }, error => {
      this.notificationService.showNotification(
        'Er ging iets fout bij het aanvragen van de wachtwoord reset. Gelieve opnieuw te proberen.',
        'warning'
      );
    });
  }

}
