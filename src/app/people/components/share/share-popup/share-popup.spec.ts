import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { AuthStore } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { SharePopup } from './share-popup';

// Deelpopup met link, klembord, mail en whatsapp.
describe('SharePopup', () => {
    let fixture: ComponentFixture<SharePopup>;
    let auth: ReturnType<typeof fakeAuthStore>;
    let activeModal: Record<string, any>;
    const ilse = testUser({ id: 'u1', firstName: 'Ilse', lastName: 'Ingelogd', fullName: 'Ilse Ingelogd', email: 'ilse@gimmi.be' });

    beforeEach(async () => {
        auth = fakeAuthStore(ilse);
        activeModal = { dismiss: vi.fn() };
        TestBed.overrideComponent(SharePopup, { set: { imports: [], schemas: [NO_ERRORS_SCHEMA] } });
        await TestBed.configureTestingModule({
            imports: [SharePopup],
            providers: [
                { provide: NgbActiveModal, useValue: activeModal },
                { provide: AuthStore, useValue: auth }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(SharePopup);
        fixture.componentInstance.linkToShare = 'https://www.gimmi.be/people/ilse';
        await fixture.whenStable();
    });

    it('toont de link en volgt de ingelogde gebruiker', () => {
        expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).value).toBe('https://www.gimmi.be/people/ilse');
        expect(fixture.componentInstance.currentUser()).toBe(ilse);
    });

    it('de boodschap bevat de link, url-gecodeerd', () => {
        expect(fixture.componentInstance.generateMessage()).toBe(encodeURIComponent(`${fixture.componentInstance.message} https://www.gimmi.be/people/ilse`));
    });

    it('sluiten via het kruisje', () => {
        (fixture.nativeElement.querySelector('.btn-close') as HTMLButtonElement).click();
        expect(activeModal.dismiss).toHaveBeenCalledWith('Cross click');
    });

});
