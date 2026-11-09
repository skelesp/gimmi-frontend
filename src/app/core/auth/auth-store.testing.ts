import { WritableSignal, signal } from '@angular/core';
import { CurrentUser } from './auth-store';

/** A logged-in person for specs; override what the spec cares about. */
export function testUser(overrides: Partial<CurrentUser> = {}): CurrentUser {
  return { id: 'u1', firstName: 'Ilse', lastName: 'Ingelogd', fullName: 'Ilse Ingelogd', email: 'ilse@gimmi.be', ...overrides };
}

/** Stand-in for AuthStore: `provide: AuthStore, useValue: fakeAuthStore(testUser())`. Set `.user` to change who is logged in. */
export function fakeAuthStore(user: CurrentUser | null = null) {
  const store = {
    user: signal<CurrentUser | null>(user) as WritableSignal<CurrentUser | null>,
    attemptedUrl: null as string | null,
    login: vi.fn().mockName('AuthStore.login'),
    logout: vi.fn().mockName('AuthStore.logout'),
    showAuthenticationConfirmation: vi.fn().mockName('AuthStore.showAuthenticationConfirmation'),
    redirectAfterAuthentication: vi.fn().mockName('AuthStore.redirectAfterAuthentication')
  };
  return store;
}
