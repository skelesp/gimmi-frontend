import { NO_ERRORS_SCHEMA, WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ApiProblem } from 'src/app/core/api/api-problem';
import { ProblemNotifier } from 'src/app/core/api/problem-notifier';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { Notifications } from 'src/app/core/notifications';
import { People, PersonProfile } from 'src/app/features/people/service/people';
import { PasswordChange } from '../../service/password-change';
import { UserDashboard } from './user-dashboard';

// sc-1990: the page of the own account: name and birthday, password, logging out everywhere.
describe('UserDashboard', () => {
  let fixture: ComponentFixture<UserDashboard>;
  let auth: ReturnType<typeof fakeAuthStore>;
  let profile: WritableSignal<PersonProfile | undefined>;
  let people: { profile: ReturnType<typeof vi.fn>; updateDetails: ReturnType<typeof vi.fn> };
  let passwordChange: { change: ReturnType<typeof vi.fn> };
  let notifications: { showNotification: ReturnType<typeof vi.fn> };
  let problems: { show: ReturnType<typeof vi.fn> };

  const ilse: PersonProfile = {
    id: 'u1', firstName: 'Ilse', lastName: 'Ingelogd', likes: [], dislikes: [],
    birthday: { year: 1990, month: 3, day: 7 }, birthdayVisibility: 'full',
    viewer: { isSelf: true, can: { update: true } }
  };

  function el(): HTMLElement { return fixture.nativeElement; }

  function type(id: string, value: string) {
    const input = el().querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function show() {
    fixture = TestBed.createComponent(UserDashboard);
    await fixture.whenStable();
  }

  beforeEach(async () => {
    auth = fakeAuthStore(testUser());
    profile = signal<PersonProfile | undefined>(ilse);
    people = {
      profile: vi.fn().mockReturnValue({ isLoading: signal(false).asReadonly(), hasValue: () => profile() !== undefined, value: profile }),
      updateDetails: vi.fn()
    };
    passwordChange = { change: vi.fn() };
    notifications = { showNotification: vi.fn() };
    problems = { show: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [UserDashboard],
      providers: [
        { provide: AuthStore, useValue: auth },
        { provide: People, useValue: people },
        { provide: PasswordChange, useValue: passwordChange },
        { provide: Notifications, useValue: notifications },
        { provide: ProblemNotifier, useValue: problems }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('fills the form with the saved profile', async () => {
    await show();
    expect(el().querySelector<HTMLInputElement>('#firstName')!.value).toBe('Ilse');
    expect(el().querySelector<HTMLInputElement>('#lastName')!.value).toBe('Ingelogd');
    expect(el().querySelector<HTMLInputElement>('#birthday')!.value).toBe('1990-03-07');
    expect(el().querySelector<HTMLSelectElement>('#birthdayVisibility')!.value).toBe('full');
  });

  it('saves the details and shows the new name everywhere', async () => {
    people.updateDetails.mockReturnValue(of({ ...ilse, firstName: 'Ilsa', lastName: 'Inlog' }));
    await show();
    type('firstName', 'Ilsa');
    type('lastName', 'Inlog');
    el().querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(people.updateDetails).toHaveBeenCalledWith('u1', { firstName: 'Ilsa', lastName: 'Inlog', birthday: '1990-03-07', birthdayVisibility: 'full' });
    expect(auth.updateName).toHaveBeenCalledWith('Ilsa', 'Inlog');
    expect(notifications.showNotification).toHaveBeenCalledWith('Je gegevens zijn bewaard.', 'success', 'Bewaard');
  });

  it('an empty birthday clears it', async () => {
    people.updateDetails.mockReturnValue(of(ilse));
    await show();
    type('birthday', '');
    el().querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(people.updateDetails).toHaveBeenCalledWith('u1', expect.objectContaining({ birthday: null }));
  });

  it('does not save without a first name', async () => {
    await show();
    type('firstName', '');
    el().querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(people.updateDetails).not.toHaveBeenCalled();
  });

  it('a failing save is shown through the problem notifier', async () => {
    const problem = new ApiProblem({ status: 500, title: 'Internal error' });
    people.updateDetails.mockReturnValue(throwError(() => problem));
    await show();
    el().querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(problems.show).toHaveBeenCalledWith(problem);
  });

  it('changes the password', async () => {
    passwordChange.change.mockReturnValue(of(testUser()));
    await show();
    const form = el().querySelectorAll('form')[1];
    const inputs = form.querySelectorAll<HTMLInputElement>('input');
    ['oud-wachtwoord', 'nieuw-wachtwoord', 'nieuw-wachtwoord'].forEach((value, i) => {
      inputs[i].value = value;
      inputs[i].dispatchEvent(new Event('input'));
    });
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(passwordChange.change).toHaveBeenCalledWith('oud-wachtwoord', 'nieuw-wachtwoord');
    expect(notifications.showNotification).toHaveBeenCalledWith(expect.stringContaining('gewijzigd'), 'success', 'Wachtwoord aangepast');
  });

  it('logs out everywhere', async () => {
    auth.signOutEverywhere.mockReturnValue(of(undefined));
    await show();
    el().querySelector<HTMLButtonElement>('#signOutEverywhere')!.click();
    await fixture.whenStable();
    expect(auth.signOutEverywhere).toHaveBeenCalled();
  });

  describe('deleting the account (sc-3565)', () => {
    function click(selector: string) { el().querySelector<HTMLButtonElement>(selector)!.click(); }

    async function confirmWith(password: string) {
      await show();
      click('#startDelete');
      await fixture.whenStable();
      const form = el().querySelectorAll('form')[2];
      const input = form.querySelector<HTMLInputElement>('input')!;
      input.value = password;
      input.dispatchEvent(new Event('input'));
      form.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    }

    it('asks for confirmation first, and cancelling goes back', async () => {
      await show();
      expect(el().querySelectorAll('form').length).toBe(2);
      click('#startDelete');
      await fixture.whenStable();
      expect(el().querySelectorAll('form').length).toBe(3);
      expect(el().querySelector('ngb-alert')!.textContent).toContain('niet ongedaan');
      click('#cancelDelete');
      await fixture.whenStable();
      expect(el().querySelectorAll('form').length).toBe(2);
      expect(auth.deleteAccount).not.toHaveBeenCalled();
    });

    it('deletes the account with the password', async () => {
      auth.deleteAccount.mockReturnValue(of(undefined));
      await confirmWith('geheim-wachtwoord');
      expect(auth.deleteAccount).toHaveBeenCalledWith('geheim-wachtwoord');
    });

    it('does not delete without a password', async () => {
      await confirmWith('');
      expect(auth.deleteAccount).not.toHaveBeenCalled();
    });

    it('a wrong password is said so, without a general error', async () => {
      auth.deleteAccount.mockReturnValue(throwError(() => new ApiProblem({ status: 401, code: 'invalid-credentials', title: 'Invalid credentials' })));
      await confirmWith('fout');
      expect(el().querySelector('#deletionError')!.textContent).toContain('klopt niet');
      expect(problems.show).not.toHaveBeenCalled();
    });

    it('another failure goes to the problem notifier', async () => {
      const problem = new ApiProblem({ status: 500, title: 'Internal error' });
      auth.deleteAccount.mockReturnValue(throwError(() => problem));
      await confirmWith('geheim-wachtwoord');
      expect(problems.show).toHaveBeenCalledWith(problem);
    });
  });

  it('without a profile: a notice instead of the forms', async () => {
    profile.set(undefined);
    await show();
    expect(el().querySelector('ngb-alert')).toBeTruthy();
    expect(el().querySelector('form')).toBeNull();
  });
});
