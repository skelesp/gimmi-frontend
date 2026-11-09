import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Validators, FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { DynamicFormGroup } from '../../../shared/components/form-components/dynamic-form-group';
import { ActivatedRoute, Router } from '@angular/router';
import { faWindows } from '@fortawesome/free-brands-svg-icons';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { UserService } from '../../service/user.service';

import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { ForgotPasswordLink } from '../forgot-password-link/forgot-password-link';
import { PasswordCheck } from '../../../shared/components/form-components/password-check/password-check';

@Component({
    selector: 'gimmi-reset-password',
    templateUrl: './reset-password.html',
    styleUrls: ['./reset-password.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgbAlert, ForgotPasswordLink, FormsModule, ReactiveFormsModule, PasswordCheck]
})
export class ResetPassword implements OnInit {
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  resetPasswordForm: DynamicFormGroup;
  readonly invalidToken = signal(false);

  ngOnInit(): void {
    this.resetPasswordForm = new FormGroup({});
    this.route.data.subscribe( data => {
      this.invalidToken.set(!data.validToken);
    });
  }

  public saveNewPassword () {
    this.userService.resetPassword(
      this.resetPasswordForm.get('passwordGroup.password').value, 
      this.route.snapshot.paramMap.get('token'))
    .subscribe( response => {
        this.notificationService.showNotification(
          'Wachtwoord reset is succesvol uitgevoerd. Je kan nu opnieuw inloggen.',
          'success',
          'Wachtwoord aangepast'
        );
        this.router.navigate(['/users/login'], {
          queryParams: { e: response.email}
        });
      },
      error => {
        this.notificationService.showNotification(
        'Wachtwoord reset is gefaald. Vermoedelijk is de link vervallen. Vraag een nieuwe link aan.',
        'error',
        'Link vervallen'
        );
        this.invalidToken.set(true);
    });
  }

}
