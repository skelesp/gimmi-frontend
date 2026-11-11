import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { email, form, required, submit } from '@angular/forms/signals';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { ApiProblem } from '../../../core/api/api-problem';
import { ProblemNotifier } from '../../../core/api/problem-notifier';
import { EmailField } from '../../../shared/components/form-components/email-field/email-field';
import { NotificationService } from '../../../shared/services/notification.service';
import { PasswordReset } from '../../service/password-reset';

@Component({
    selector: 'gimmi-forgot-password',
    templateUrl: './forgot-password.html',
    styleUrls: ['./forgot-password.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgbAlert, EmailField]
})
export class ForgotPassword {
  private passwordReset = inject(PasswordReset);
  private problems = inject(ProblemNotifier);
  private notifications = inject(NotificationService);

  protected readonly details = signal({ email: new URLSearchParams(location.search).get('e') ?? '' });
  protected readonly forgotPasswordForm = form(this.details, path => {
    required(path.email, { message: 'Email is een verplicht veld' });
    email(path.email, { message: 'Geef een geldig emailadres in (formaat: *** @ *** . **)' });
  });

  protected readonly successAlertClosed = signal(false);
  readonly requestSent = signal(false);

  protected requestPasswordReset(event: Event): Promise<boolean> {
    event.preventDefault();
    return submit(this.forgotPasswordForm, async () => {
      try {
        await firstValueFrom(this.passwordReset.request(this.details().email));
      } catch (error) {
        if (error instanceof ApiProblem) {
          this.problems.show(error);
        } else {
          console.error(error);
          this.notifications.showNotification('Er ging iets fout bij het aanvragen van de wachtwoord reset. Gelieve opnieuw te proberen.', 'warning');
        }
        return;
      }
      this.successAlertClosed.set(false);
      this.requestSent.set(true);
    });
  }
}
