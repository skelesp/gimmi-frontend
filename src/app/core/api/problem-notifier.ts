import { Service, inject } from '@angular/core';
import { NotificationService } from '../../shared/services/notification.service';
import { ApiProblem } from './api-problem';
import { problemMessage } from './error-messages';

@Service()
export class ProblemNotifier {
  private notifications = inject(NotificationService);

  /** Shows the message for the problem as a toast; for a server error also the `requestId` (Sentry trace). */
  show(problem: ApiProblem): void {
    let message = problemMessage(problem);
    if (problem.isServerError && problem.requestId) {
      message += ` (referentie: ${problem.requestId})`;
    }
    this.notifications.showNotification(message, 'error');
  }
}
