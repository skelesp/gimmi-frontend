import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormControl, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { faWindows } from '@fortawesome/free-brands-svg-icons';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { UserService } from '../../service/user.service';

import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { ForgotPasswordLinkComponent } from '../forgot-password-link/forgot-password-link.component';
import { PasswordCheckComponent } from '../../../shared/components/form-components/password-check/password-check.component';

@Component({
    selector: 'gimmi-reset-password',
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgbAlert, ForgotPasswordLinkComponent, FormsModule, ReactiveFormsModule, PasswordCheckComponent]
})
export class ResetPasswordComponent implements OnInit {
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  resetPasswordForm: UntypedFormGroup;
  invalidToken : boolean;

  ngOnInit(): void {
    this.resetPasswordForm = new UntypedFormGroup({ });
    this.route.data.subscribe( data => {
      this.invalidToken = !data.validToken;
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
        this.invalidToken = true;
    });
  }

}
