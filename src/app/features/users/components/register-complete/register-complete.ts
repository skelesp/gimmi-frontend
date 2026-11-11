import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { form, maxLength, minLength, required, submit, validate } from '@angular/forms/signals';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormField } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ApiProblem } from '../../../../core/api/api-problem';
import type { Schema } from '../../../../core/api/api-types';
import { problemMessage } from '../../../../core/api/error-messages';
import { fieldErrors } from '../../../../core/api/form-errors';
import { ProblemNotifier } from '../../../../core/api/problem-notifier';
import { AuthStore } from '../../../../core/auth/auth-store';
import { PasswordField } from '../../../../shared/components/form-components/password-field/password-field';
import { Notifications } from '../../../../core/notifications';
import { Registration } from '../../service/registration';

/** Registering, step 2: the link from the mail (`/users/register/:token`) leads here to choose a name and password. */
@Component({
    selector: 'gimmi-register-complete',
    templateUrl: './register-complete.html',
    styleUrls: ['./register-complete.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, FormField, PasswordField]
})
export class RegisterComplete {
  private route = inject(ActivatedRoute);
  private registration = inject(Registration);
  private auth = inject(AuthStore);
  private problems = inject(ProblemNotifier);
  private notifications = inject(Notifications);

  private readonly token = this.route.snapshot.paramMap.get('token')!;
  /** The address the link confirms; `null` when the link is unknown, used or expired. */
  protected readonly pending = signal<Schema<'RegistrationInfo'> | null>(this.route.snapshot.data['registration']);
  /** Set when the account with this address appeared while the form was open. */
  protected readonly emailTaken = signal(false);
  protected readonly serverErrors = signal<Record<string, string[]>>({});

  protected readonly details = signal({ firstName: '', lastName: '', birthday: '', password: '', passwordCheck: '' });
  protected readonly registerForm = form(this.details, path => {
    required(path.firstName, { message: 'Voornaam is een verplicht veld' });
    required(path.lastName, { message: 'Familienaam is een verplicht veld' });
    required(path.birthday, { message: 'Verjaardag is een verplicht veld' });
    required(path.password, { message: 'Wachtwoord is een verplicht veld.' });
    minLength(path.password, 8, { message: 'Het wachtwoord moet minstens 8 tekens lang zijn.' });
    maxLength(path.password, 72, { message: 'Het wachtwoord is te lang.' });
    validate(path.passwordCheck, ({ value, valueOf }) =>
      value() && value() !== valueOf(path.password) ? { kind: 'noPasswordMatch', message: 'De 2 wachtwoorden moeten overeenkomen.' } : undefined);
  });

  protected register(event: Event): Promise<boolean> {
    event.preventDefault();
    return submit(this.registerForm, async () => {
      const { firstName, lastName, birthday, password } = this.details();
      this.serverErrors.set({});
      try {
        await firstValueFrom(this.registration.complete(this.token, { firstName, lastName, birthday, password }));
        this.auth.showAuthenticationConfirmation();
        this.auth.redirectAfterAuthentication();
      } catch (error) {
        this.showError(error);
      }
    });
  }

  private showError(error: unknown): void {
    if (!(error instanceof ApiProblem)) {
      console.error(error);
      this.notifications.showNotification('Registreren lukt nu niet. Probeer het straks opnieuw.', 'error');
    } else if (error.status === 404) {
      this.pending.set(null); // the link was used or expired in the meantime
    } else if (error.code === 'email-taken') {
      this.emailTaken.set(true);
    } else if (error.code === 'password-too-weak' || error.code === 'password-too-long') {
      this.serverErrors.set({ password: [problemMessage(error)] });
    } else if (error.code === 'validation' && error.errors.length) {
      this.serverErrors.set(fieldErrors(error));
    } else {
      this.problems.show(error);
    }
  }
}
