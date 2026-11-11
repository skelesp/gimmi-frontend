import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, convertToParamMap } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';

import { ApiProblem } from 'src/app/core/api/api-problem';
import { Registration } from '../service/registration';
import { registrationResolver } from './registration-resolver';

describe('registrationResolver', () => {
  let registration: { get: ReturnType<typeof vi.fn> };

  function resolve() {
    const route = { paramMap: convertToParamMap({ token: 'tok1' }) } as ActivatedRouteSnapshot;
    return firstValueFrom(TestBed.runInInjectionContext(() => registrationResolver(route, {} as RouterStateSnapshot)) as never);
  }

  beforeEach(() => {
    registration = { get: vi.fn() };
    TestBed.configureTestingModule({ providers: [{ provide: Registration, useValue: registration }] });
  });

  it('gives the pending registration of a valid link', async () => {
    const info = { email: 'ria@gimmi.be', expiresAt: '2026-11-10T10:00:00Z' };
    registration.get.mockReturnValue(of(info));
    expect(await resolve()).toEqual(info);
    expect(registration.get).toHaveBeenCalledWith('tok1');
  });

  it('gives null for an unknown, used or expired link (404)', async () => {
    registration.get.mockReturnValue(throwError(() => new ApiProblem({ status: 404, code: 'not-found' })));
    expect(await resolve()).toBeNull();
  });

  it('passes on any other failure', async () => {
    registration.get.mockReturnValue(throwError(() => new ApiProblem({ status: 503, code: 'unavailable' })));
    await expect(resolve()).rejects.toBeInstanceOf(ApiProblem);
  });
});
