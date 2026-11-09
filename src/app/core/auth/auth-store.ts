import { Service, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../shared/services/notification.service';
import { ApiClient } from '../api/api-client';
import { ApiProblem } from '../api/api-problem';
import type { Schema } from '../api/api-types';

/** Who is logged in: the part of `GET /me` the app uses, with the name as people see it. */
export type CurrentUser = Pick<Schema<'Account'>, 'id' | 'email' | 'firstName' | 'lastName'> & { fullName: string };

export type LogoutReason = 'USER_EVENT' | 'EXPIRED_TOKEN' | '401_RESPONSE';

interface Session {
  token: string;
  expiresAt: string;
  user: CurrentUser;
}

// Tokens last 7 days. One that has a day behind it is renewed when the app starts, so someone who keeps
// using the app is not logged out every week.
const renewBelowMs = 6 * 24 * 60 * 60 * 1000;
const storageKey = 'currentUser';

/**
 * The login session: the (opaque) token of API v2 and the person it belongs to. The session is kept in
 * `localStorage`; a token of the old API (a bare string, not JSON) is not accepted any more and counts
 * as logged out.
 */
@Service()
export class AuthStore {
  private api = inject(ApiClient);
  private router = inject(Router);
  private notifications = inject(NotificationService);

  private readonly session = signal<Session | null>(this.readSession());

  readonly user = computed(() => this.session()?.user ?? null);
  /** For the interceptor: sent as `Authorization` to our own API only. */
  readonly token = computed(() => this.session()?.token ?? null);

  /** Where the person wanted to go before being sent to the login. */
  attemptedUrl: string | null = null;

  /** Logs in and loads the person behind the token (`GET /me`). Errors arrive as `ApiProblem`. */
  login(email: string, password: string): Observable<CurrentUser> {
    return this.api.post('/auth/token', { body: { email, password } }).pipe(switchMap(token => this.startSession(token)));
  }

  /**
   * Starts the session with a token from the API (login, registration, password reset) and loads the person
   * behind it (`GET /me`).
   */
  startSession({ token, expiresAt }: Schema<'TokenResponse'>): Observable<CurrentUser> {
    // The token must be set before /me: the interceptor reads it from here.
    this.session.set({ token, expiresAt, user: null });
    return this.api.get('/me').pipe(
      map(({ id, email, firstName, lastName }) => ({ id, email, firstName, lastName, fullName: `${firstName} ${lastName}` })),
      tap(user => this.setSession({ token, expiresAt, user })),
      catchError(error => {
        this.session.set(null);
        return throwError(() => error);
      })
    );
  }

  /** Forgets the token on this device and reloads, so no state of the person stays behind. */
  logout(reason: LogoutReason): void {
    console.info(`[AuthStore] User logged out. Reason: ${reason}`);
    this.clearSession();
    this.notifications.showNotification('Je gebruiker is nu uitgelogd.', 'info', 'Uitgelogd');
    location.reload();
  }

  /** Makes every token of the person stop working, on every device (not in the UI yet). */
  signOutEverywhere(): Observable<void> {
    return this.api.delete('/me/tokens').pipe(tap(() => this.logout('USER_EVENT')));
  }

  /** At startup: swaps a token older than a day for a fresh one. Another failure leaves the session as it is. */
  renewIfNeeded(): Observable<void> {
    const session = this.session();
    if (!session || Date.parse(session.expiresAt) - Date.now() > renewBelowMs) {
      return of(undefined);
    }
    return this.api.post('/auth/token/renewal').pipe(
      tap(({ token, expiresAt }) => this.setSession({ ...session, token, expiresAt })),
      map((): void => undefined),
      catchError(error => {
        if (error instanceof ApiProblem && error.status === 401) {
          this.clearSession();
          this.notifications.showNotification('Je sessie is verlopen. Gelieve opnieuw in te loggen.', 'warning', 'Uitgelogd');
          this.router.navigate(['/users/login']);
        } else {
          console.error('[AuthStore] Token renewal failed, the session stays as it is', error);
        }
        return of(undefined);
      })
    );
  }

  showAuthenticationConfirmation(): void {
    const user = this.user();
    console.info(`[AuthStore] User ${user.id} is authenticated.`);
    this.notifications.showNotification(
      'Je bent nu ingelogd in Gimmi. <br> Veel plezier gewenst!',
      'success',
      `Welkom ${user.firstName}`
    );
  }

  /** After a successful login: back to the page the person tried to reach, or to their own list. */
  redirectAfterAuthentication(): void {
    const user = this.user();
    if (!user) {
      return;
    }
    const redirectUrl = this.attemptedUrl ?? `/people/${user.id}`;
    console.info(`[AuthStore] User is redirected to ${redirectUrl}`);
    this.router.navigateByUrl(redirectUrl);
    this.attemptedUrl = null;
  }

  private setSession(session: Session): void {
    this.session.set(session);
    try {
      localStorage.setItem(storageKey, JSON.stringify(session));
    } catch {
      // No storage (private window): the session lasts until the page closes.
    }
  }

  private clearSession(): void {
    this.session.set(null);
    this.removeStored();
  }

  private removeStored(): void {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Nothing stored.
    }
  }

  private readSession(): Session | null {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(storageKey);
    } catch {
      return null;
    }
    if (!stored) {
      console.info('[AuthStore] No session found in local storage');
      return null;
    }
    const session = parseSession(stored);
    if (!session || Date.parse(session.expiresAt) <= Date.now()) {
      // An old token (v1) or an expired one.
      console.info('[AuthStore] Stored session is expired or from the old API');
      this.removeStored();
      this.notifications.showNotification('Je sessie is verlopen. Gelieve opnieuw in te loggen.', 'warning', 'Uitgelogd');
      return null;
    }
    return session;
  }
}

function parseSession(stored: string): Session | null {
  try {
    const session = JSON.parse(stored);
    return typeof session?.token === 'string' && typeof session.expiresAt === 'string' && session.user?.id ? session : null;
  } catch {
    return null;
  }
}
