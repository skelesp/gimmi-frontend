import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import { UserService } from '../service/user.service';
import { PasswordResetTokenResolver } from './password-reset-token-resolver.service';

// Controleert het token uit de resetlink voor /users/resetpassword/:token wordt getoond (sc-2004).
describe('PasswordResetTokenResolver', () => {
  let resolver: PasswordResetTokenResolver;
  let users: jasmine.SpyObj<UserService>;
  const route = { paramMap: convertToParamMap({ token: 'abc123' }) } as ActivatedRouteSnapshot;

  function resolve(): boolean {
    let resultaat: boolean;
    (resolver.resolve(route, null) as Observable<boolean>).subscribe(r => resultaat = r);
    return resultaat;
  }

  beforeEach(() => {
    users = jasmine.createSpyObj<UserService>('UserService', ['validatePasswordResetToken']);
    TestBed.configureTestingModule({ providers: [{ provide: UserService, useValue: users }] });
    resolver = TestBed.inject(PasswordResetTokenResolver);
  });

  it('vraagt het token uit de url na: geldig = true', () => {
    users.validatePasswordResetToken.and.returnValue(of({ firstName: 'Ria', token: 'abc123', expiresOn: new Date() } as any));
    expect(resolve()).toBeTrue();
    expect(users.validatePasswordResetToken).toHaveBeenCalledWith('abc123');
  });

  it('onbekend of vervallen token (404): false, de pagina toont dan de uitleg', () => {
    users.validatePasswordResetToken.and.returnValue(throwError({ status: 404 }));
    expect(resolve()).toBeFalse();
  });

  it('leeg antwoord: false', () => {
    users.validatePasswordResetToken.and.returnValue(of(null));
    expect(resolve()).toBeFalse();
  });
});
