import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { FormField, form, maxLength, minLength, required, submit, validate } from '@angular/forms/signals';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { ApiProblem } from '../../../../core/api/api-problem';
import type { Schema } from '../../../../core/api/api-types';
import { problemMessage } from '../../../../core/api/error-messages';
import { ProblemNotifier } from '../../../../core/api/problem-notifier';
import { AuthStore } from '../../../../core/auth/auth-store';
import { Notifications } from '../../../../core/notifications';
import { PasswordField } from '../../../../shared/components/form-components/password-field/password-field';
import { People } from '../../../people/service/people';
import { PasswordChange } from '../../service/password-change';

type Visibility = Schema<'BirthdayVisibility'>;

/** What other people see of the birthday, in the words of the person. */
export const visibilityOptions: { value: Visibility; label: string }[] = [
  { value: 'day-month', label: 'Dag en maand (niet het jaar)' },
  { value: 'full', label: 'Dag, maand en jaar' },
  { value: 'hidden', label: 'Niets' }
];

/** The page of your own account on `/users/:userId`: name and birthday, password, and logging out everywhere. */
@Component({
    selector: 'gimmi-user-dashboard',
    templateUrl: './user-dashboard.html',
    styleUrls: ['./user-dashboard.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgbAlert, FormField, PasswordField]
})
export class UserDashboard {
  private auth = inject(AuthStore);
  private people = inject(People);
  private passwordChange = inject(PasswordChange);
  private problems = inject(ProblemNotifier);
  private notifications = inject(Notifications);

  protected readonly user = this.auth.user;
  protected readonly visibilityOptions = visibilityOptions;
  private readonly profileResource = this.people.profile(() => this.user()?.id);
  protected readonly loading = this.profileResource.isLoading;
  protected readonly profile = computed(() => this.profileResource.hasValue() ? this.profileResource.value() : null);

  /** Starts from the saved profile; a saved profile replaces the form. */
  protected readonly details = linkedSignal(() => {
    const profile = this.profile();
    const birthday = profile?.birthday;
    return {
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      birthday: birthday?.year ? isoDate(birthday.year, birthday.month, birthday.day) : '',
      birthdayVisibility: (profile?.birthdayVisibility ?? 'day-month') as Visibility
    };
  });
  protected readonly detailsForm = form(this.details, path => {
    required(path.firstName, { message: 'Voornaam is een verplicht veld.' });
    maxLength(path.firstName, 100, { message: 'De voornaam is te lang.' });
    required(path.lastName, { message: 'Achternaam is een verplicht veld.' });
    maxLength(path.lastName, 100, { message: 'De achternaam is te lang.' });
    validate(path.birthday, ({ value }) =>
      value() && value() > today() ? { kind: 'future', message: 'Je verjaardag ligt niet in de toekomst.' } : undefined);
  });

  protected readonly passwords = signal({ currentPassword: '', password: '', passwordCheck: '' });
  protected readonly passwordForm = form(this.passwords, path => {
    required(path.currentPassword, { message: 'Je huidige wachtwoord is een verplicht veld.' });
    required(path.password, { message: 'Wachtwoord is een verplicht veld.' });
    minLength(path.password, 8, { message: 'Het wachtwoord moet minstens 8 tekens lang zijn.' });
    maxLength(path.password, 72, { message: 'Het wachtwoord is te lang.' });
    validate(path.passwordCheck, ({ value, valueOf }) =>
      value() && value() !== valueOf(path.password) ? { kind: 'noPasswordMatch', message: 'De 2 wachtwoorden moeten overeenkomen.' } : undefined);
  });
  protected readonly passwordError = signal('');

  protected saveDetails(event: Event): Promise<boolean> {
    event.preventDefault();
    return submit(this.detailsForm, async () => {
      const { firstName, lastName, birthday, birthdayVisibility } = this.details();
      try {
        const saved = await firstValueFrom(this.people.updateDetails(this.user()!.id, {
          firstName: firstName.trim(), lastName: lastName.trim(), birthday: birthday || null, birthdayVisibility
        }));
        this.profileResource.value.set(saved);
        this.auth.updateName(saved.firstName, saved.lastName);
        this.notifications.showNotification('Je gegevens zijn bewaard.', 'success', 'Bewaard');
      } catch (error) {
        this.showError(error, 'Je gegevens bewaren lukt nu niet. Probeer het straks opnieuw.');
      }
    });
  }

  protected savePassword(event: Event): Promise<boolean> {
    event.preventDefault();
    return submit(this.passwordForm, async () => {
      this.passwordError.set('');
      const { currentPassword, password } = this.passwords();
      try {
        await firstValueFrom(this.passwordChange.change(currentPassword, password));
        this.passwordForm().reset({ currentPassword: '', password: '', passwordCheck: '' });
        this.notifications.showNotification('Je wachtwoord is gewijzigd. Op je andere toestellen log je opnieuw in.', 'success', 'Wachtwoord aangepast');
      } catch (error) {
        if (error instanceof ApiProblem && ['current-password-incorrect', 'password-too-weak', 'password-too-long'].includes(error.code)) {
          this.passwordError.set(problemMessage(error));
        } else {
          this.showError(error, 'Wachtwoord wijzigen lukt nu niet. Probeer het straks opnieuw.');
        }
      }
    });
  }

  protected async signOutEverywhere(): Promise<void> {
    try {
      await firstValueFrom(this.auth.signOutEverywhere());
    } catch (error) {
      this.showError(error, 'Overal uitloggen lukt nu niet. Probeer het straks opnieuw.');
    }
  }

  private showError(error: unknown, fallback: string): void {
    if (error instanceof ApiProblem) {
      this.problems.show(error);
    } else {
      console.error(error);
      this.notifications.showNotification(fallback, 'error');
    }
  }
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function today(): string {
  const now = new Date();
  return isoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
