import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { email, form, required, submit } from '@angular/forms/signals';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { ApiProblem } from '../../../core/api/api-problem';
import { ProblemNotifier } from '../../../core/api/problem-notifier';
import { EmailField } from '../../../shared/components/form-components/email-field/email-field';
import { NotificationService } from '../../../shared/services/notification.service';
import { Registration } from '../../service/registration';

/** Registering, step 1: the address. The mail with the link to step 2 (`RegisterComplete`) follows. */
@Component({
    selector: 'gimmi-register',
    templateUrl: './register.html',
    styleUrls: ['./register.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgbAlert, EmailField]
})
export class Register {
  private registration = inject(Registration);
  private problems = inject(ProblemNotifier);
  private notifications = inject(NotificationService);

  protected readonly details = signal({ email: new URLSearchParams(location.search).get('e') ?? '' });
  protected readonly registerForm = form(this.details, path => {
    required(path.email, { message: 'Email is een verplicht veld' });
    email(path.email, { message: 'Geef een geldig emailadres in (formaat: *** @ *** . **)' });
  });

  protected readonly infoAlertClosed = signal(false);
  /** The address the mail was sent to; set once the request was accepted. */
  readonly sentTo = signal<string | null>(null);

  protected register(event: Event): Promise<boolean> {
    event.preventDefault();
    return submit(this.registerForm, async () => {
      const { email } = this.details();
      try {
        await firstValueFrom(this.registration.start(email));
      } catch (error) {
        if (error instanceof ApiProblem) {
          this.problems.show(error);
        } else {
          console.error(error);
          this.notifications.showNotification('Registreren lukt nu niet. Probeer het straks opnieuw.', 'error');
        }
        return;
      }
      this.sentTo.set(email);
    });
  }
}
