import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { AuthStore, CurrentUser } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { PersonProfile } from '../../service/people';
import { PersonDashboard } from './person-dashboard';
import { Share } from '../share/share';
import { ExtraInfo } from '../extra-info/extra-info';
import { WishList } from '../../../wishes/components/wish-list/wish-list';

// Overzichtspagina van een persoon op /people/:personId (sc-1959): naam, delen, extra info en
// de wenslijst.
describe('PersonDashboard', () => {
    let fixture: ComponentFixture<PersonDashboard>;
    let auth: ReturnType<typeof fakeAuthStore>;
    const ilse = testUser({ id: 'ilse', firstName: 'Ilse', lastName: 'Ingelogd', fullName: 'Ilse Ingelogd', email: 'ilse@gimmi.be' });

    function ria(isSelf = false): PersonProfile {
        return {
            id: 'ria', firstName: 'Ria', lastName: 'Receiver',
            likes: [{ text: 'Boeken', url: null }], dislikes: [],
            viewer: { isSelf, can: { update: isSelf } }
        };
    }

    async function toon(person: PersonProfile | null, user: CurrentUser | null) {
        auth.user.set(user);
        TestBed.overrideProvider(ActivatedRoute, { useValue: { data: of({ person }) } });
        fixture = TestBed.createComponent(PersonDashboard);
        await fixture.whenStable();
    }

    function el(): HTMLElement { return fixture.nativeElement; }

    function kind(naam: string): any {
        return fixture.debugElement.query(e => e.name === naam);
    }

    beforeEach(async () => {
        auth = fakeAuthStore(null);
        TestBed.overrideComponent(PersonDashboard, { remove: { imports: [Share, ExtraInfo, WishList] }, add: { schemas: [NO_ERRORS_SCHEMA] } });
        await TestBed.configureTestingModule({
    imports: [PersonDashboard],
    providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: auth },
        { provide: ActivatedRoute, useValue: {} }
    ],
    schemas: [NO_ERRORS_SCHEMA]
}).compileComponents();
    });

    it('onbekende persoon: "geen lijst gevonden"', async () => {
        await toon(null, ilse);
        expect(el().querySelector('ngb-alert').textContent).toContain('Sorry, geen lijst gevonden.');
        expect(kind('gimmi-wish-list')).toBeNull();
    });

    it('toont de naam, deelknop en de wenslijst van de persoon', async () => {
        await toon(ria(), ilse);
        expect(el().querySelector('h1').textContent.trim()).toBe('Ria Receiver');
        expect(kind('gimmi-share').nativeElement.personToShare).toMatchObject({ id: 'ria', fullName: 'Ria Receiver' });
        expect(kind('gimmi-wish-list').nativeElement.receiver).toMatchObject({ id: 'ria', firstName: 'Ria', lastName: 'Receiver' });
    });

    it('lijst van een ander: link "Ga naar mijn lijst"; extra info alleen-lezen', async () => {
        await toon(ria(), ilse);
        const link: HTMLAnchorElement = el().querySelector('a.badge');
        expect(link.textContent.trim()).toBe('Ga naar mijn lijst');
        expect(link.hidden).toBe(false);
        expect(link.getAttribute('href')).toBe('/people/ilse');
        expect(fixture.componentInstance.personIsUser()).toBe(false);
        expect(kind('gimmi-extra-info').nativeElement.canEdit).toBe(false);
    });

    it('eigen lijst (viewer.isSelf): link verborgen en extra info bewerkbaar (viewer.can.update)', async () => {
        await toon(ria(true), testUser({ id: 'ria', firstName: 'Ria', lastName: 'Receiver', fullName: 'Ria Receiver', email: 'ria@gimmi.be' }));
        expect((el().querySelector('a.badge') as HTMLElement).hidden).toBe(true);
        expect(fixture.componentInstance.personIsUser()).toBe(true);
        expect(kind('gimmi-extra-info').nativeElement.canEdit).toBe(true);
    });

    it('niet ingelogd: geen link naar een eigen lijst', async () => {
        await toon(ria(), null);
        expect(el().querySelector('a.badge')).toBeNull();
    });

    it('geeft id, voornaam en extra info door, en neemt het bewaarde profiel over zonder de wenslijst te herladen', async () => {
        await toon(ria(true), ilse);
        const extra = kind('gimmi-extra-info');
        expect(extra.nativeElement.personId).toBe('ria');
        expect(extra.nativeElement.firstName).toBe('Ria');
        expect(extra.nativeElement.likes).toEqual([{ text: 'Boeken', url: null }]);
        const receiver = fixture.componentInstance.receiver();

        const bijgewerkt: PersonProfile = { ...ria(true), likes: [{ text: 'Puzzels', url: null }], dislikes: [{ text: 'Sokken', url: null }] };
        extra.triggerEventHandler('saved', bijgewerkt);
        await fixture.whenStable();
        expect(fixture.componentInstance.profile()).toBe(bijgewerkt);
        expect(extra.nativeElement.dislikes).toEqual([{ text: 'Sokken', url: null }]);
        expect(fixture.componentInstance.receiver()).toBe(receiver);
    });
});
