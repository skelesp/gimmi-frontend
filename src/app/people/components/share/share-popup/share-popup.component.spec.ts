import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject } from 'rxjs';

import { User } from 'src/app/users/models/user.model';
import { UserService } from 'src/app/users/service/user.service';
import { SharePopupComponent } from './share-popup.component';

// Deelpopup met link, klembord, mail en whatsapp.
describe('SharePopupComponent', () => {
    let fixture: ComponentFixture<SharePopupComponent>;
    let currentUser$: BehaviorSubject<User>;
    let activeModal: Record<string, any>;
    const ilse = new User('u1', 'Ingelogd', 'Ilse', 'ilse@gimmi.be', 'local', 't', []);

    beforeEach(async () => {
        currentUser$ = new BehaviorSubject<User>(ilse);
        activeModal = { dismiss: vi.fn() };
        TestBed.overrideComponent(SharePopupComponent, { set: { imports: [], schemas: [NO_ERRORS_SCHEMA] } });
        await TestBed.configureTestingModule({
            imports: [SharePopupComponent],
            providers: [
                { provide: NgbActiveModal, useValue: activeModal },
                { provide: UserService, useValue: { currentUser$: currentUser$.asObservable() } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(SharePopupComponent);
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

    it('stopt met luisteren bij het sluiten', () => {
        fixture.destroy();
        expect(currentUser$.observers.length).toBe(0);
    });
});
