import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbCollapseModule, NgbConfig } from '@ng-bootstrap/ng-bootstrap';

import { AuthStore, CurrentUser } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { NavigationBar } from './navigation-bar';
import { BrandLogo } from '../brand-logo/brand-logo';
import { PeopleSearch } from '../../../people/components/people-search/people-search';
import { UserMenu } from '../../../users/components/user-menu/user-menu';
import { UnknownUserMenu } from '../../../users/components/unknown-user-menu/unknown-user-menu';

// Navigatiebalk (sc-2001). Het zoekveld staat vast in de balk en niet in het inklapmenu (sc-41).
describe('NavigationBar', () => {
    let fixture: ComponentFixture<NavigationBar>;
    let auth: ReturnType<typeof fakeAuthStore>;
    const ilse = testUser({ id: 'u1', firstName: 'Ilse', lastName: 'Ingelogd', fullName: 'Ilse Ingelogd', email: 'ilse@gimmi.be' });

    async function toon(user: CurrentUser) {
        auth.user.set(user);
        fixture = TestBed.createComponent(NavigationBar);
        await fixture.whenStable();
    }

    function el(): HTMLElement { return fixture.nativeElement; }

    beforeEach(async () => {
        auth = fakeAuthStore(null);
        TestBed.overrideComponent(NavigationBar, { remove: { imports: [BrandLogo, PeopleSearch, UserMenu, UnknownUserMenu] }, add: { schemas: [NO_ERRORS_SCHEMA] } });
        await TestBed.configureTestingModule({
    imports: [NgbCollapseModule, NavigationBar],
    providers: [{ provide: AuthStore, useValue: auth }],
    schemas: [NO_ERRORS_SCHEMA]
}).compileComponents();
        // Zonder animatie staat het menu meteen open of dicht (anders tijdelijk "collapsing").
        TestBed.inject(NgbConfig).animation = false;
    });

    it('logo en zoekveld staan altijd in de balk, het zoekveld buiten het inklapmenu (sc-41)', async () => {
        await toon(null);
        expect(el().querySelector('.navbar-brand gimmi-brand-logo')).toBeTruthy();
        const zoek = el().querySelector('gimmi-people-search');
        expect(zoek).toBeTruthy();
        expect(zoek.closest('.navbar-collapse')).toBeNull();
    });

    it('niet ingelogd: menuknop en een ingeklapt menu voor onbekende gebruikers', async () => {
        await toon(null);
        expect(el().querySelector('button.navbar-toggler')).toBeTruthy();
        expect(el().querySelector('gimmi-user-menu')).toBeNull();
        const menu = el().querySelector('.navbar-collapse');
        expect(menu.querySelector('gimmi-unknown-user-menu')).toBeTruthy();
        expect(menu.classList).not.toContain('show');
    });

    it('de menuknop klapt het menu open en weer dicht', async () => {
        await toon(null);
        const knop: HTMLButtonElement = el().querySelector('button.navbar-toggler');
        knop.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.isNavbarCollapsed).toBe(false);
        expect(el().querySelector('.navbar-collapse').classList).toContain('show');
        knop.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.isNavbarCollapsed).toBe(true);
    });

    it('een keuze in het menu klapt het weer dicht', async () => {
        await toon(null);
        fixture.componentInstance.toggleNavbarCollapseState();
        await fixture.whenStable();
        fixture.debugElement.query(e => e.name === 'gimmi-unknown-user-menu').triggerEventHandler('menuItemClicked', null);
        expect(fixture.componentInstance.isNavbarCollapsed).toBe(true);
    });

    it('ingelogd: gebruikersmenu, geen menuknop en geen menu voor onbekenden', async () => {
        await toon(ilse);
        expect(el().querySelector('gimmi-user-menu')).toBeTruthy();
        expect(el().querySelector('button.navbar-toggler')).toBeNull();
        expect(el().querySelector('gimmi-unknown-user-menu')).toBeNull();
    });

    it('volgt in- en uitloggen', async () => {
        await toon(null);
        auth.user.set(ilse);
        await fixture.whenStable();
        expect(el().querySelector('gimmi-user-menu')).toBeTruthy();
        auth.user.set(null);
        await fixture.whenStable();
        expect(el().querySelector('gimmi-user-menu')).toBeNull();
    });

});
