import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, maxLength, minLength, required, submit, validate } from '@angular/forms/signals';
import { ActivatedRoute } from '@angular/router';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { ApiProblem } from '../../../../core/api/api-problem';
import type { Schema } from '../../../../core/api/api-types';
import { problemMessage } from '../../../../core/api/error-messages';
import { ProblemNotifier } from '../../../../core/api/problem-notifier';
import { AuthStore } from '../../../../core/auth/auth-store';
import { PasswordField } from '../../../../shared/components/form-components/password-field/password-field';
import { Notifications } from '../../../../core/notifications';
import { PasswordReset } from '../../service/password-reset';
import { ForgotPasswordLink } from '../forgot-password-link/forgot-password-link';

/** The link from the reset mail (`/users/resetpassword/:token`): choose a new password and be logged in. */
@Component({
    selector: 'gimmi-reset-password',
    templateUrl: './reset-password.html',
    styleUrls: ['./reset-password.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgbAlert, ForgotPasswordLink, PasswordField]
})
export class ResetPassword {
  private route = inject(ActivatedRoute);
  private passwordReset = inject(PasswordReset);
  private auth = inject(AuthStore);
  private problems = inject(ProblemNotifier);
  private notifications = inject(Notifications);

  private readonly token = this.route.snapshot.paramMap.get('token')!;
  /** `null` when the link is unknown, used or expired. */
  private readonly pending = signal<Schema<'PasswordResetInfo'> | null>(this.route.snapshot.data['passwordReset']);
  readonly invalidToken = computed(() => !this.pending());
  protected readonly serverError = signal('');

  protected readonly details = signal({ password: '', passwordCheck: '' });
  protected readonly resetPasswordForm = form(this.details, path => {
    required(path.password, { message: 'Wachtwoord is een verplicht veld.' });
    minLength(path.password, 8, { message: 'Het wachtwoord moet minstens 8 tekens lang zijn.' });
    maxLength(path.password, 72, { message: 'Het wachtwoord is te lang.' });
    validate(path.passwordCheck, ({ value, valueOf }) =>
      value() && value() !== valueOf(path.password) ? { kind: 'noPasswordMatch', message: 'De 2 wachtwoorden moeten overeenkomen.' } : undefined);
  });

  protected saveNewPassword(event: Event): Promise<boolean> {
    event.preventDefault();
    return submit(this.resetPasswordForm, async () => {
      this.serverError.set('');
      try {
        await firstValueFrom(this.passwordReset.complete(this.token, this.details().password));
        this.notifications.showNotification(
          'Wachtwoord reset is succesvol uitgevoerd. Je bent meteen ingelogd.',
          'success',
          'Wachtwoord aangepast'
        );
        this.auth.redirectAfterAuthentication();
      } catch (error) {
        this.showError(error);
      }
    });
  }

  private showError(error: unknown): void {
    if (!(error instanceof ApiProblem)) {
      console.error(error);
      this.notifications.showNotification('Wachtwoord wijzigen lukt nu niet. Probeer het straks opnieuw.', 'error');
    } else if (error.status === 404) {
      this.notifications.showNotification(
        'Wachtwoord reset is gefaald. Vermoedelijk is de link vervallen. Vraag een nieuwe link aan.',
        'error',
        'Link vervallen'
      );
      this.pending.set(null);
    } else if (error.code === 'password-too-weak' || error.code === 'password-too-long') {
      this.serverError.set(problemMessage(error));
    } else {
      this.problems.show(error);
    }
  }
}
