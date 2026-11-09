import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { email, form, required, submit } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiProblem } from '../../../core/api/api-problem';
import { ProblemNotifier } from '../../../core/api/problem-notifier';
import { AuthStore } from '../../../core/auth/auth-store';
import { EmailField } from '../../../shared/components/form-components/email-field/email-field';
import { PasswordField } from '../../../shared/components/form-components/password-field/password-field';
import { NotificationService } from '../../../shared/services/notification.service';
import { ForgotPasswordLink } from '../forgot-password-link/forgot-password-link';

@Component({
    selector: 'gimmi-login',
    templateUrl: './login.html',
    styleUrls: ['./login.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, ForgotPasswordLink, EmailField, PasswordField]
})
export class Login implements OnDestroy {
  private auth = inject(AuthStore);
  private problems = inject(ProblemNotifier);
  private notifications = inject(NotificationService);

  // `?e=` pre-fills the address (links from mails and from the register page).
  protected readonly credentials = signal({ email: new URLSearchParams(location.search).get('e') ?? '', password: '' });
  protected readonly loginForm = form(this.credentials, path => {
    required(path.email, { message: 'Email is een verplicht veld' });
    email(path.email, { message: 'Geef een geldig emailadres in (formaat: *** @ *** . **)' });
    required(path.password, { message: 'Wachtwoord is een verplicht veld.' });
  });

  readonly authenticationError = signal(false);
  protected readonly loggedInUser = this.auth.user;
  // Only used to show where the person goes after logging in.
  readonly redirectUrl = this.auth.attemptedUrl ? environment.rootSiteUrl + this.auth.attemptedUrl : null;

  protected login(event: Event): Promise<boolean> {
    event.preventDefault();
    return submit(this.loginForm, async () => {
      const { email, password } = this.credentials();
      try {
        await firstValueFrom(this.auth.login(email, password));
      } catch (error) {
        this.showError(error);
        return;
      }
      this.authenticationError.set(false);
      this.loginForm().reset({ email: '', password: '' });
      this.auth.showAuthenticationConfirmation();
      this.auth.redirectAfterAuthentication();
    });
  }

  private showError(error: unknown): void {
    if (error instanceof ApiProblem && error.code === 'invalid-credentials') {
      this.authenticationError.set(true);
    } else if (error instanceof ApiProblem) {
      this.authenticationError.set(false);
      this.problems.show(error);
    } else {
      console.error(error);
      this.notifications.showNotification('Inloggen lukt nu niet. Probeer het straks opnieuw.', 'error');
    }
  }

  ngOnDestroy () {
    this.auth.attemptedUrl = null;
  }
}
