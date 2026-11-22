import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { ownAccountGuard } from './own-account-guard';

@Component({ template: '' })
class DummyComponent { }

// sc-1990: /users/:userId only shows the own account.
describe('ownAccountGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'users/:userId', component: DummyComponent, canActivate: [ownAccountGuard] }]),
        { provide: AuthStore, useValue: fakeAuthStore(testUser({ id: 'u1' })) }
      ]
    });
  });

  it('own id: lets through', async () => {
    await RouterTestingHarness.create('/users/u1');
    expect(TestBed.inject(Router).url).toBe('/users/u1');
  });

  it('someone else\'s id: to the own account', async () => {
    await RouterTestingHarness.create('/users/u2');
    expect(TestBed.inject(Router).url).toBe('/users/u1');
  });
});
