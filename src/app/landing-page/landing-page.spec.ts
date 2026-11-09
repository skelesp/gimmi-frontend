import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthStore, CurrentUser } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { Share } from '../people/components/share/share';
import { HowToUse } from './how-to-use/how-to-use';
import { LandingPageBanner } from './landing-page-banner/landing-page-banner';
import { LandingPage } from './landing-page';

// Landingspagina (sc-1985): banner met call to action en "Hoe werkt het?".
// De call to action navigeert naar registreren of naar de eigen lijst (sc-2381).
describe('LandingPage', () => {
    let fixture: ComponentFixture<LandingPage>;
    let auth: ReturnType<typeof fakeAuthStore>;
    const ilse = testUser({ id: 'u1', firstName: 'Ilse', lastName: 'Ingelogd', fullName: 'Ilse Ingelogd', email: 'ilse@gimmi.be' });

    async function toon(user: CurrentUser) {
        auth.user.set(user);
        fixture = TestBed.createComponent(LandingPage);
        await fixture.whenStable();
    }

    /** Zichtbare call-to-actionknoppen in de banner (groot en klein scherm), [tekst, href]. */
    function ctas(): [
        string,
        string
    ][] {
        const links: HTMLAnchorElement[] = Array.from(fixture.nativeElement.querySelectorAll('gimmi-landing-page-banner a.btn'));
        return links.filter(a => !a.hidden).map(a => [a.textContent.trim(), a.getAttribute('href')]);
    }

    beforeEach(async () => {
        auth = fakeAuthStore(null);
        TestBed.overrideComponent(HowToUse, { remove: { imports: [Share] }, add: { schemas: [NO_ERRORS_SCHEMA] } });
        await TestBed.configureTestingModule({
    imports: [LandingPage, LandingPageBanner, HowToUse],
    providers: [provideRouter([]), { provide: AuthStore, useValue: auth }],
    schemas: [NO_ERRORS_SCHEMA]
}).compileComponents();
    });

    it('toont de banner en "Hoe werkt het?" met de vier stappen', async () => {
        await toon(null);
        expect(fixture.nativeElement.querySelector('gimmi-landing-page-banner')).toBeTruthy();
        const stappen = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('gimmi-how-to-use h3')).map((h: HTMLElement) => h.textContent.trim());
        expect(stappen).toEqual(['Registreer', 'Voeg wensen toe', 'Verspreid je lijst', 'Krijg cadeaus!']);
    });

    it('banner heeft een versie voor grote en voor kleine schermen', async () => {
        await toon(null);
        const jumbotrons: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.jumbotron'));
        expect(jumbotrons.map(j => j.className)).toEqual([
            expect.stringMatching(/d-none d-md-block/),
            expect.stringMatching(/d-block d-md-none/)
        ]);
    });

    it('niet ingelogd: de call to action gaat naar registreren (sc-2381)', async () => {
        await toon(null);
        expect(ctas()).toEqual([
            ['Start nu met Gimmi en ontdek het zelf!', '/users/register'],
            ['Start nu met Gimmi en ontdek het zelf!', '/users/register']
        ]);
    });

    it('ingelogd: de call to action gaat naar de eigen overzichtspagina (sc-2381)', async () => {
        await toon(ilse);
        expect(ctas()).toEqual([
            ['Ga naar je overzichtspagina, Ilse!', '/people/u1'],
            ['Ga naar je overzichtspagina, Ilse!', '/people/u1']
        ]);
    });

    it('"Hoe werkt het?": niet ingelogd leidt de lijst-stap naar registreren en is er niets te delen', async () => {
        await toon(null);
        const iconen = fixture.debugElement.query(sel => sel.name === 'gimmi-how-to-use').componentInstance as HowToUse;
        expect(iconen.currentUser()).toBeNull();
        expect(fixture.nativeElement.querySelector('gimmi-how-to-use gimmi-share')).toBeNull();
    });

    it('"Hoe werkt het?": ingelogd verschijnt de deelknop met de eigen persoon', async () => {
        await toon(ilse);
        const share = fixture.debugElement.query(el => el.name === 'gimmi-share');
        expect(share).toBeTruthy();
        expect(share.nativeElement.personToShare).toBe(ilse);
    });

});
