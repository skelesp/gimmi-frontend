import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { email, form, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ApiProblem } from '../../../core/api/api-problem';
import { ProblemNotifier } from '../../../core/api/problem-notifier';
import { EmailField } from '../../../shared/components/form-components/email-field/email-field';
import { NotificationService } from '../../../shared/services/notification.service';
import { People } from '../../service/people';

/** Invite someone who has no list yet: the server sends the mail (its text is fixed). */
@Component({
    selector: 'gimmi-invite',
    templateUrl: './invite.html',
    styleUrls: ['./invite.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [EmailField]
})
export class Invite {
  private people = inject(People);
  private problems = inject(ProblemNotifier);
  private notifications = inject(NotificationService);

  protected readonly invitation = signal({ email: '' });
  protected readonly invitationForm = form(this.invitation, path => {
    required(path.email, { message: 'Email is een verplicht veld' });
    email(path.email, { message: 'Geef een geldig emailadres in (formaat: *** @ *** . **)' });
  });

  protected invite(event: Event): Promise<boolean> {
    event.preventDefault();
    return submit(this.invitationForm, async () => {
      try {
        await firstValueFrom(this.people.invite(this.invitation().email));
      } catch (error) {
        if (error instanceof ApiProblem) {
          this.problems.show(error);
        } else {
          console.error(error);
          this.notifications.showNotification('Uitnodigen lukt nu niet. Probeer het straks opnieuw.', 'error');
        }
        return;
      }
      this.notifications.showNotification('De uitnodiging werd verzonden.', 'success');
      this.invitationForm().reset({ email: '' });
    });
  }
}
