import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, convertToParamMap } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';

import { ApiProblem } from 'src/app/core/api/api-problem';
import { PasswordReset } from '../service/password-reset';
import { passwordResetResolver } from './password-reset-resolver';

// Checks the token of the reset link before /users/resetpassword/:token is shown (sc-2004, sc-3286).
describe('passwordResetResolver', () => {
  let passwordReset: { get: ReturnType<typeof vi.fn> };

  function resolve() {
    const route = { paramMap: convertToParamMap({ token: 'abc123' }) } as ActivatedRouteSnapshot;
    return firstValueFrom(TestBed.runInInjectionContext(() => passwordResetResolver(route, {} as RouterStateSnapshot)) as never);
  }

  beforeEach(() => {
    passwordReset = { get: vi.fn() };
    TestBed.configureTestingModule({ providers: [{ provide: PasswordReset, useValue: passwordReset }] });
  });

  it('gives the pending reset of a valid link', async () => {
    const info = { firstName: 'Ria', expiresAt: '2026-11-10T10:00:00Z' };
    passwordReset.get.mockReturnValue(of(info));
    expect(await resolve()).toEqual(info);
    expect(passwordReset.get).toHaveBeenCalledWith('abc123');
  });

  it('gives null for an unknown, used or expired link (404)', async () => {
    passwordReset.get.mockReturnValue(throwError(() => new ApiProblem({ status: 404, code: 'not-found' })));
    expect(await resolve()).toBeNull();
  });

  it('passes on any other failure', async () => {
    passwordReset.get.mockReturnValue(throwError(() => new ApiProblem({ status: 503, code: 'unavailable' })));
    await expect(resolve()).rejects.toBeInstanceOf(ApiProblem);
  });
});
