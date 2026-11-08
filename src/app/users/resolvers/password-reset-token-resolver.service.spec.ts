
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import { UserService } from '../service/user.service';
import { PasswordResetTokenResolver } from './password-reset-token-resolver.service';

// Controleert het token uit de resetlink voor /users/resetpassword/:token wordt getoond (sc-2004).
describe('PasswordResetTokenResolver', () => {
    let resolver: PasswordResetTokenResolver;
    let users: Record<string, any>;
    const route = { paramMap: convertToParamMap({ token: 'abc123' }) } as ActivatedRouteSnapshot;

    function resolve(): boolean {
        let resultaat: boolean;
        (resolver.resolve(route, null) as Observable<boolean>).subscribe(r => resultaat = r);
        return resultaat;
    }

    beforeEach(() => {
        users = {
            validatePasswordResetToken: vi.fn().mockName("UserService.validatePasswordResetToken")
        };
        TestBed.configureTestingModule({ providers: [{ provide: UserService, useValue: users }] });
        resolver = TestBed.inject(PasswordResetTokenResolver);
    });

    it('vraagt het token uit de url na: geldig = true', () => {
        users.validatePasswordResetToken.mockReturnValue(of({ firstName: 'Ria', token: 'abc123', expiresOn: new Date() } as any));
        expect(resolve()).toBe(true);
        expect(users.validatePasswordResetToken).toHaveBeenCalledWith('abc123');
    });

    it('onbekend of vervallen token (404): false, de pagina toont dan de uitleg', () => {
        users.validatePasswordResetToken.mockReturnValue(throwError({ status: 404 }));
        expect(resolve()).toBe(false);
    });

    it('leeg antwoord: false', () => {
        users.validatePasswordResetToken.mockReturnValue(of(null));
        expect(resolve()).toBe(false);
    });
});
