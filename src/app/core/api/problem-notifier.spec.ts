import { TestBed } from '@angular/core/testing';

import { NotificationService } from '../../shared/services/notification.service';
import { ApiProblem, ProblemCode } from './api-problem';
import { errorMessages } from './error-messages';
import { ProblemNotifier } from './problem-notifier';

describe('ProblemNotifier', () => {
  let notifications: { showNotification: ReturnType<typeof vi.fn> };
  let notifier: ProblemNotifier;

  beforeEach(() => {
    notifications = { showNotification: vi.fn() };
    TestBed.configureTestingModule({ providers: [{ provide: NotificationService, useValue: notifications }] });
    notifier = TestBed.inject(ProblemNotifier);
  });

  it('shows the message for the code', () => {
    notifier.show(new ApiProblem({ code: 'email-taken', status: 409, requestId: 'r1' }));
    expect(notifications.showNotification).toHaveBeenCalledWith(errorMessages['email-taken'], 'error');
  });

  it('adds the requestId on a server error', () => {
    notifier.show(new ApiProblem({ code: 'unavailable' as ProblemCode, status: 503, requestId: 'abc123' }));
    expect(notifications.showNotification).toHaveBeenCalledWith(
      errorMessages.unavailable + ' (referentie: abc123)', 'error'
    );
  });
});
