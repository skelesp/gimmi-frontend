import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { loggedOutGuard } from './logged-out-guard';

@Component({ template: '' })
class DummyComponent { }

// sc-674: the login page of someone who is logged in already leads on.
describe('loggedOutGuard', () => {
  let auth: ReturnType<typeof fakeAuthStore>;

  beforeEach(() => {
    auth = fakeAuthStore();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'users/login', component: DummyComponent, canActivate: [loggedOutGuard] },
          { path: 'people/:id', component: DummyComponent },
          { path: 'wishes/:id', component: DummyComponent }
        ]),
        { provide: AuthStore, useValue: auth }
      ]
    });
  });

  it('not logged in: shows the login page', async () => {
    await RouterTestingHarness.create('/users/login');
    expect(TestBed.inject(Router).url).toBe('/users/login');
  });

  it('logged in: to the own list', async () => {
    auth.user.set(testUser());
    await RouterTestingHarness.create('/users/login');
    expect(TestBed.inject(Router).url).toBe(`/people/${testUser().id}`);
  });

  it('logged in with an attempted url: to that page, once', async () => {
    auth.user.set(testUser());
    auth.attemptedUrl = '/wishes/w1';
    await RouterTestingHarness.create('/users/login');
    expect(TestBed.inject(Router).url).toBe('/wishes/w1');
    expect(auth.attemptedUrl).toBeNull();
  });
});
