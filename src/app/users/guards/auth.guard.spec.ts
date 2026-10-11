import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, Observable } from 'rxjs';

import { User } from '../models/user.model';
import { UserService } from '../service/user.service';
import { AuthGuard } from './auth.guard';

// sc-2041: niet ingelogd -> naar login, en onthouden waar de gebruiker heen wilde.
describe('AuthGuard', () => {
  let guard: AuthGuard;
  let router: Router;
  let users: { currentUser$: BehaviorSubject<User>; attemptedUrl: string };

  function check(url: string): boolean | UrlTree {
    let resultaat: boolean | UrlTree;
    (guard.canActivate({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot) as Observable<boolean | UrlTree>)
      .subscribe(v => resultaat = v);
    return resultaat;
  }

  beforeEach(() => {
    users = { currentUser$: new BehaviorSubject<User>(null), attemptedUrl: null };
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: UserService, useValue: users }]
    });
    guard = TestBed.inject(AuthGuard);
    router = TestBed.inject(Router);
  });

  it('ingelogd: doorlaten', () => {
    users.currentUser$.next(new User('u1', 'R', 'Ria', 'ria@gimmi.be', 'local', 't', []));
    expect(check('/people/p9')).toBeTrue();
    expect(users.attemptedUrl).toBeNull();
  });

  it('niet ingelogd: naar login en de gevraagde url onthouden', () => {
    spyOn(console, 'error');
    const r = check('/people/p9');
    expect(router.serializeUrl(r as UrlTree)).toBe('/users/login');
    expect(users.attemptedUrl).toBe('/people/p9');
  });
});
