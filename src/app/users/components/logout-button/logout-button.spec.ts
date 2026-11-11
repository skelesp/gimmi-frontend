import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { LogoutButton } from './logout-button';

describe('LogoutButton', () => {
  let fixture: ComponentFixture<LogoutButton>;
  let auth: ReturnType<typeof fakeAuthStore>;

  beforeEach(async () => {
    auth = fakeAuthStore(testUser());
    TestBed.configureTestingModule({ providers: [{ provide: AuthStore, useValue: auth }] });
    fixture = TestBed.createComponent(LogoutButton);
    await fixture.whenStable();
  });

  it('logs out as a user event when clicked', () => {
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(auth.logout).toHaveBeenCalledWith('USER_EVENT');
  });
});
